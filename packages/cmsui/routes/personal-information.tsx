import {
  redirect,
  RouterContextProvider,
  useFetcher,
  useLoaderData,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from 'react-router';
import { requireAuthCookie } from '@plone/react-router';
import {
  ploneClientContext,
  ploneUserContext,
} from '@plone/aurora/app/middleware.server';
import { Button } from '@plone/components/quanta';
import { useAppForm } from '../components/Form/Form';

export async function loader({
  request,
  context,
}: LoaderFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);
  const user = context.get(ploneUserContext);
  const cli = context.get(ploneClientContext);
  const { data: userschema } = await cli.getUserschema();
  return { user, userschema };
}

export async function action({
  request,
  context,
}: ActionFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);

  const data = await request.json();
  const cli = context.get(ploneClientContext);
  const user = context.get(ploneUserContext);

  if (user?.id) {
    await cli.updateUser({ id: user.id, data });
  }

  return redirect('/@@personal-information');
}

type LoaderData = Awaited<ReturnType<typeof loader>>;

export default function PersonalInformation() {
  const { user, userschema } = useLoaderData<typeof loader>();
  // reload persisted values
  return (
    <PersonalInformationForm
      key={JSON.stringify(user)}
      user={user}
      userschema={userschema}
    />
  );
}

function PersonalInformationForm({
  user,
  userschema,
}: {
  user: LoaderData['user'];
  userschema: LoaderData['userschema'];
}) {
  const properties = userschema.properties as Record<string, any>;
  const fetcher = useFetcher();

  const form = useAppForm({
    defaultValues: (user ?? {}) as Record<string, unknown>,
    onSubmit: async ({ value }) => {
      // skip `portrait`
      const data: Record<string, string> = {};
      userschema.fieldsets.forEach((fieldset) =>
        fieldset.fields.forEach((field) => {
          if (field === 'portrait') return;
          const v = (value as Record<string, unknown>)[field];
          if (typeof v === 'string' && v !== '') data[field] = v;
        }),
      );
      fetcher.submit(data, { method: 'post', encType: 'application/json' });
    },
  });

  return (
    <>
      <h1 className="documentFirstHeading">Personal Information</h1>
      <form>
        {userschema.fieldsets.map((fieldset) => (
          <div key={fieldset.id}>
            {fieldset.fields.map((schemaField, index) => (
              <form.AppField
                name={schemaField}
                key={index}
                // eslint-disable-next-line react/no-children-prop
                children={(field) => (
                  <field.Quanta
                    {...properties[schemaField]}
                    className="mb-4"
                    label={properties[schemaField].title}
                    name={field.name}
                    defaultValue={field.state.value}
                    required={userschema.required.includes(schemaField)}
                    error={field.state.meta.errors}
                  />
                )}
              />
            ))}
          </div>
        ))}
        <Button
          type="submit"
          variant="primary"
          accent
          onPress={() => form.handleSubmit()}
        >
          Save
        </Button>
      </form>
    </>
  );
}
