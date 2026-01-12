import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");
  const since = searchParams.get("since");

  // TODO: Get access token from user's session/database
  const accessToken = request.headers.get("x-github-token");

  if (!accessToken) {
    return NextResponse.json(
      { error: "GitHub not connected" },
      { status: 401 }
    );
  }

  if (!owner || !repo) {
    return NextResponse.json(
      { error: "Missing owner or repo parameter" },
      { status: 400 }
    );
  }

  try {
    const params = new URLSearchParams({
      per_page: "100",
    });

    if (since) {
      params.set("since", since);
    }

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const commits = await response.json();

    // Get detailed info for each commit (including stats)
    const detailedCommits = await Promise.all(
      commits.slice(0, 50).map(async (commit: { sha: string }) => {
        const detailResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/commits/${commit.sha}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: "application/vnd.github.v3+json",
            },
          }
        );
        return detailResponse.json();
      })
    );

    // Transform to our format
    const formattedCommits = detailedCommits.map((commit: {
      sha: string;
      commit: {
        message: string;
        author: { name: string; date: string };
      };
      stats?: { total: number; additions: number; deletions: number };
      files?: Array<unknown>;
    }) => ({
      sha: commit.sha,
      message: commit.commit.message.split("\n")[0], // First line only
      author: commit.commit.author.name,
      committedAt: new Date(commit.commit.author.date).getTime(),
      filesChanged: commit.stats?.total || commit.files?.length || 0,
      additions: commit.stats?.additions || 0,
      deletions: commit.stats?.deletions || 0,
    }));

    return NextResponse.json(formattedCommits);
  } catch (error) {
    console.error("Error fetching commits:", error);
    return NextResponse.json(
      { error: "Failed to fetch commits" },
      { status: 500 }
    );
  }
}
