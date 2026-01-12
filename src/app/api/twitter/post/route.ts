import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body as { text: string };

    if (!text) {
      return NextResponse.json(
        { error: "Tweet text is required" },
        { status: 400 }
      );
    }

    if (text.length > 280) {
      return NextResponse.json(
        { error: "Tweet exceeds 280 characters" },
        { status: 400 }
      );
    }

    // TODO: Get access token from user's session/database
    const accessToken = request.headers.get("x-twitter-token");

    if (!accessToken) {
      return NextResponse.json(
        { error: "Twitter not connected" },
        { status: 401 }
      );
    }

    const response = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Twitter API error:", errorData);

      // Handle token refresh if needed
      if (response.status === 401) {
        // TODO: Attempt to refresh the token
        return NextResponse.json(
          { error: "Twitter authentication expired. Please reconnect." },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: "Failed to post tweet" },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      tweetId: data.data.id,
      text: data.data.text,
    });
  } catch (error) {
    console.error("Error posting tweet:", error);
    return NextResponse.json(
      { error: "Failed to post tweet" },
      { status: 500 }
    );
  }
}
