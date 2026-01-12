import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // TODO: Get access token from user's session/database
  const accessToken = request.headers.get("x-github-token");

  if (!accessToken) {
    return NextResponse.json(
      { error: "GitHub not connected" },
      { status: 401 }
    );
  }

  try {
    const response = await fetch(
      "https://api.github.com/user/repos?sort=updated&per_page=100",
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

    const repos = await response.json();

    // Transform to our format
    const formattedRepos = repos.map((repo: {
      id: number;
      full_name: string;
      private: boolean;
      default_branch: string;
    }) => ({
      githubRepoId: repo.id,
      name: repo.full_name,
      isPublic: !repo.private,
      defaultBranch: repo.default_branch,
    }));

    return NextResponse.json(formattedRepos);
  } catch (error) {
    console.error("Error fetching repos:", error);
    return NextResponse.json(
      { error: "Failed to fetch repositories" },
      { status: 500 }
    );
  }
}
