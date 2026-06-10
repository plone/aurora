import {
  RouterContextProvider,
  useLoaderData,
  type LoaderFunctionArgs,
} from 'react-router';
import { requireAuthCookie } from '@plone/react-router';
import { ploneUserContext } from '@plone/aurora/app/middleware.server';

export async function loader({
  request,
  context,
}: LoaderFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);
  const user = context.get(ploneUserContext);
  return { user };
}

export default function PersonalInformation() {
  const { user } = useLoaderData<typeof loader>();
  return (
    <>
      <h1 className="documentFirstHeading">Personal Information</h1>
      <pre>{JSON.stringify(user, null, 2)}</pre>
    </>
  );
}
