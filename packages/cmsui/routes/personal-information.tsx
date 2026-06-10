import {
  RouterContextProvider,
  useLoaderData,
  type LoaderFunctionArgs,
} from 'react-router';
import { requireAuthCookie } from '@plone/react-router';
import {
  ploneClientContext,
  ploneUserContext,
} from '@plone/aurora/app/middleware.server';
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

export default function PersonalInformation() {
  const { user, userschema } = useLoaderData<typeof loader>();
  const properties = userschema.properties as Record<string, any>;

  const form = useAppForm({
    defaultValues: (user ?? {}) as Record<string, unknown>,
    onSubmit: async ({ value }) => {
      // eslint-disable-next-line no-console
      console.log('personal-information submit (not wired yet)', value);
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
      </form>
    </>
  );
}
