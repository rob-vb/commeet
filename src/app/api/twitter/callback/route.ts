import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const storedState = request.cookies.get("twitter_state")?.value;
  const codeVerifier = request.cookies.get("twitter_code_verifier")?.value;

  // Clear cookies
  const response = NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL}/settings`
  );
  response.cookies.delete("twitter_state");
  response.cookies.delete("twitter_code_verifier");

  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=twitter_auth_denied`
    );
  }

  if (!code || !state || !storedState || state !== storedState) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=invalid_state`
    );
  }

  if (!codeVerifier) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=missing_verifier`
    );
  }

  try {
    // Exchange code for access token
    const clientId = process.env.TWITTER_CLIENT_ID;
    const clientSecret = process.env.TWITTER_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/twitter/callback`;

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
      "base64"
    );

    const tokenResponse = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error("Twitter token error:", tokenData.error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=token_exchange_failed`
      );
    }

    const { access_token, refresh_token } = tokenData;

    // Get user info from Twitter
    const userResponse = await fetch("https://api.twitter.com/2/users/me", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const userData = await userResponse.json();

    // TODO: Store the access token, refresh token, and Twitter user info in the database
    // This would involve:
    // 1. Getting the current authenticated user from the session
    // 2. Updating their record with Twitter credentials
    // For now, we'll just redirect with success

    console.log("Twitter connected for user:", userData.data?.username);

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?twitter=connected`
    );
  } catch (error) {
    console.error("Twitter OAuth error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=twitter_oauth_failed`
    );
  }
}
