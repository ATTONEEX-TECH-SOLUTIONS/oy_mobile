import { Redirect } from 'expo-router';

export default function Index() {
  const isLoggedIn = false; // replace later with real auth

  if (!isLoggedIn) {
    return <Redirect href="/login" />;
  }

  return <Redirect href="/home" />;
}
