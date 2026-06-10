import { RouterContextProvider, type LoaderFunctionArgs } from 'react-router';
import { requireAuthCookie } from '@plone/react-router';

export async function loader({
  request,
}: LoaderFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);
  return {};
}

export default function PersonalInformation() {
  return <h1 className="documentFirstHeading">Personal Information</h1>;
}
