const SUPABASE_URL = "https://bfqsqgfyyewnfxekirfv.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_OM-LGm9LZCtmzkGYmpyA8A_jnvgmH1-";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );

const KEYS = {
  user: "ars_user",
  letter: "ars_letter",
  letterColor: "ars_letter_color",
  bg: "ars_background",
  streak: "ars_streak_state",
  wheel: "ars_wheel_week",
  plan: "ars_plan"
};

let currentUser = {};
let posts = [];
let stories = [];
let currentPage = "homePage";
let currentCommentPost = null;
let currentStory = null;
let wheelRotation = 0;
let initialized = false;

const $ = id =>
  document.getElementById(id);

const esc = value =>
  String(value ?? "").replace(
    /[&<>"']/g,
    char =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[char]
  );

const fmt = number => {
  number = Number(number || 0);

  if (number >= 1000000) {
    return `${(number / 1000000)
      .toFixed(1)
      .replace(".0", "")}M`;
  }

  if (number >= 1000) {
    return `${(number / 1000)
      .toFixed(1)
      .replace(".0", "")}K`;
  }

  return String(number);
};

const timeAgo = iso => {
  const seconds = Math.max(
    0,
    (Date.now() -
      new Date(iso).getTime()) /
      1000
  );

  if (seconds < 60) {
    return `${Math.floor(seconds)}s`;
  }

  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m`;
  }

  if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)}h`;
  }

  return `${Math.floor(seconds / 86400)}d`;
};

const extractHashtags = text =>
  [
    ...String(text || "").matchAll(
      /(^|\s)#([A-Za-z0-9_]+)/g
    )
  ].map(match =>
    match[2].toLowerCase()
  );

const refreshIcons = () =>
  window.lucide?.createIcons?.();

function toast(message) {
  const element = $("toast");

  if (!element) {
    return;
  }

  element.textContent = message;

  element.classList.add("show");

  clearTimeout(
    window.__arsToast
  );

  window.__arsToast =
    setTimeout(
      () =>
        element.classList.remove(
          "show"
        ),
      2200
    );
}

function getUser() {
  return currentUser;
}

function avatarMarkup(
  user = {},
  cls = "avatar"
) {
  if (user.avatar === "wheel") {
    return `
      <div class="${cls} wheel-avatar">
        <i data-lucide="orbit"></i>
      </div>
    `;
  }

  const image =
    typeof user.avatar === "string" &&
    /^(https?:|data:image)/.test(
      user.avatar
    );

  const letter =
    String(
      user.letter ||
        localStorage.getItem(
          KEYS.letter
        ) ||
        "R"
    )
      .slice(0, 1)
      .toUpperCase();

  const color =
    user.letterColor ||
    localStorage.getItem(
      KEYS.letterColor
    ) ||
    "#8d2cff";

  if (image) {
    return `
      <div class="${cls}">
        <img
          src="${esc(user.avatar)}"
          alt=""
        >
      </div>
    `;
  }

  return `
    <div
      class="${cls}"
      style="--avatar:${esc(color)}"
    >
      <span>${esc(letter)}</span>
    </div>
  `;
}

function richText(text) {
  const safe = esc(text);

  return safe.replace(
    /(^|\s)(#[A-Za-z0-9_]+)/g,
    '$1<button class="hashtag" data-hashtag="$2">$2</button>'
  );
}

function normalizeProfile(profile) {
  return {
    ...profile,

    id: profile.id || "",

    display_name:
      profile.display_name ||
      "You",

    username:
      profile.username ||
      "you",

    avatar:
      profile.avatar ||
      "",

    verified:
      Boolean(profile.verified),

    plan:
      profile.plan ||
      "free",

    letter:
      localStorage.getItem(
        KEYS.letter
      ) ||
      profile.letter ||
      "R",

    letterColor:
      localStorage.getItem(
        KEYS.letterColor
      ) ||
      profile.letter_color ||
      "#8d2cff"
  };
}

function normalizePost(row) {
  const user =
    row.users || {};

  return {
    id: row.id,

    user_id:
      row.user_id,

    display_name:
      user.display_name ||
      "You",

    username:
      user.username ||
      "you",

    avatar:
      user.avatar ||
      "",

    verified:
      Boolean(user.verified),

    text:
      row.content ||
      "",

    image:
      row.image ||
      "",

    created_at:
      row.created_at,

    likes:
      Number(
        row.likes ??
          row.likes_count ??
          0
      ),

    comments:
      Number(
        row.comments ??
          row.comments_count ??
          0
      ),

    reposts:
      Number(
        row.reposts ??
          row.reposts_count ??
          0
      ),

    views:
      Number(
        row.views ??
          row.views_count ??
          0
      ),

    liked:
      Boolean(row.liked),

    reposted:
      Boolean(row.reposted),

    bookmarked:
      Boolean(row.bookmarked),

    comments_data:
      row.comments_data || [],

    hashtags:
      extractHashtags(
        row.content || ""
      )
  };
}

function normalizeStory(row) {
  const user =
    row.users || {};

  return {
    id: row.id,

    user_id:
      row.user_id,

    display_name:
      user.display_name ||
      "You",

    username:
      user.username ||
      "you",

    avatar:
      user.avatar ||
      "",

    verified:
      Boolean(user.verified),

    image:
      row.image ||
      "",

    created_at:
      row.created_at,

    expires_at:
      row.expires_at
  };
}

async function loadData() {
  const {
    data: { session },
    error: sessionError
  } =
    await supabaseClient.auth.getSession();

  if (
    sessionError ||
    !session?.user
  ) {
    window.location.replace(
      "index.html"
    );

    return false;
  }

  const userId =
    session.user.id;

  const [
    profileResult,
    postsResult,
    storiesResult,
    likesResult,
    repostsResult,
    bookmarksResult,
    commentsResult,
    allLikesResult,
    allRepostsResult
  ] = await Promise.all([
    supabaseClient
      .from("users")
      .select(
        "id,username,display_name,email,bio,avatar,cover,verified,plan,streak,xp"
      )
      .eq("id", userId)
      .maybeSingle(),

    supabaseClient
      .from("posts")
      .select(
        "id,created_at,user_id,content,image,likes_count,comments_count,reposts_count,views_count,users:user_id(id,username,display_name,avatar,verified)"
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      ),

    supabaseClient
      .from("stories")
      .select(
        "id,created_at,user_id,image,viewers_count,expires_at,users:user_id(id,username,display_name,avatar,verified)"
      )
      .or(
        `expires_at.is.null,expires_at.gt.${new Date().toISOString()}`
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      ),

    supabaseClient
      .from("likes")
      .select("post_id")
      .eq(
        "user_id",
        userId
      ),

    supabaseClient
      .from("reposts")
      .select("post_id")
      .eq(
        "user_id",
        userId
      ),

    supabaseClient
      .from("bookmarks")
      .select("post_id")
      .eq(
        "user_id",
        userId
      ),

    supabaseClient
      .from("comments")
      .select(
        "id,created_at,post_id,user_id,content,users:user_id(id,username,display_name,avatar,verified)"
      )
      .order(
        "created_at",
        {
          ascending: true
        }
      ),

    supabaseClient
      .from("likes")
      .select("post_id"),

    supabaseClient
      .from("reposts")
      .select("post_id")
  ]);

  const firstError = [
    profileResult,
    postsResult,
    storiesResult,
    likesResult,
    repostsResult,
    bookmarksResult,
    commentsResult
  ].find(
    result => result.error
  );

  if (firstError) {
    console.error(
      firstError.error
    );

    toast(
      firstError.error.message ||
        "Unable to load ARS data."
    );

    return false;
  }

  currentUser =
    normalizeProfile(
      profileResult.data || {
        id: userId,
        email:
          session.user.email || "",
        display_name:
          session.user.user_metadata
            ?.display_name ||
          "You",
        username:
          session.user.user_metadata
            ?.username ||
          "you"
      }
    );

  localStorage.setItem(
    KEYS.user,
    JSON.stringify(
      currentUser
    )
  );

  localStorage.setItem(
    KEYS.plan,
    currentUser.plan ||
      "free"
  );

  const likedIds =
    new Set(
      (likesResult.data || [])
        .map(row =>
          String(row.post_id)
        )
    );

  const repostedIds =
    new Set(
      (repostsResult.data || [])
        .map(row =>
          String(row.post_id)
        )
    );

  const bookmarkedIds =
    new Set(
      (bookmarksResult.data || [])
        .map(row =>
          String(row.post_id)
        )
    );

  const likeCounts =
    new Map();

  const repostCounts =
    new Map();

  (
    allLikesResult.data ||
    []
  ).forEach(row => {
    const key =
      String(row.post_id);

    likeCounts.set(
      key,
      (likeCounts.get(key) || 0) +
        1
    );
  });

  (
    allRepostsResult.data ||
    []
  ).forEach(row => {
    const key =
      String(row.post_id);

    repostCounts.set(
      key,
      (repostCounts.get(key) || 0) +
        1
    );
  });

  const commentsByPost =
    new Map();

  (
    commentsResult.data ||
    []
  ).forEach(comment => {
    const user =
      comment.users || {};

    const item = {
      id: comment.id,

      user_id:
        comment.user_id,

      display_name:
        user.display_name ||
        "User",

      username:
        user.username ||
        "",

      avatar:
        user.avatar ||
        "",

      letter:
        (
          user.display_name ||
          "U"
        )
          .slice(0, 1)
          .toUpperCase(),

      letter_color:
        "#9b38ff",

      text:
        comment.content ||
        "",

      created_at:
        comment.created_at
    };

    const key =
      String(
        comment.post_id
      );

    if (
      !commentsByPost.has(key)
    ) {
      commentsByPost.set(
        key,
        []
      );
    }

    commentsByPost
      .get(key)
      .push(item);
  });

  posts =
    (
      postsResult.data ||
      []
    ).map(row =>
      normalizePost({
        ...row,

        likes:
          likeCounts.get(
            String(row.id)
          ) ??
          Number(
            row.likes_count || 0
          ),

        comments:
          commentsByPost.get(
            String(row.id)
          )?.length ??
          Number(
            row.comments_count || 0
          ),

        reposts:
          repostCounts.get(
            String(row.id)
          ) ??
          Number(
            row.reposts_count || 0
          ),

        views:
          Number(
            row.views_count || 0
          ),

        liked:
          likedIds.has(
            String(row.id)
          ),

        reposted:
          repostedIds.has(
            String(row.id)
          ),

        bookmarked:
          bookmarkedIds.has(
            String(row.id)
          ),

        comments_data:
          commentsByPost.get(
            String(row.id)
          ) || []
      })
    );

  stories =
    (
      storiesResult.data ||
      []
    ).map(
      normalizeStory
    );

  return true;
}

function renderTopAvatar() {
  $("profileButton").innerHTML =
    avatarMarkup(
      getUser(),
      "avatar"
    );

  refreshIcons();
}

function renderStories() {
  const me =
    getUser();

  const mine =
    stories.filter(
      story =>
        String(
          story.user_id
        ) ===
        String(me.id)
    );

  const people = [];

  people.push({
    story:
      mine[0] || {
        ...me,
        id: me.id,
        image: ""
      },
    mine: true
  });

  const seen =
    new Set([
      String(me.id)
    ]);

  stories.forEach(
    story => {
      if (
        !seen.has(
          String(
            story.user_id
          )
        )
      ) {
        people.push({
          story,
          mine: false
        });

        seen.add(
          String(
            story.user_id
          )
        );
      }
    }
  );

  $("stories").innerHTML =
    people
      .map(
        ({
          story,
          mine
        }) => `
          <button
            class="story-item"
            data-story-group="${esc(
              story.user_id
            )}"
          >

            ${avatarMarkup(
              story,
              "story-avatar"
            )}

            ${
              mine
                ? `
                  <span class="story-plus">
                    <i data-lucide="plus"></i>
                  </span>
                `
                : ""
            }

            <span class="story-name">
              ${esc(
                mine
                  ? "You"
                  : story.display_name
              )}
            </span>

          </button>
        `
      )
      .join("");

  refreshIcons();
}

function postAvatar(post) {
  return avatarMarkup(
    post,
    "post-avatar"
  );
}

function postCardMarkup(post) {
  return `
    <article
      class="post-card"
      data-post-id="${esc(
        post.id
      )}"
    >

      <div class="post-head">

        ${postAvatar(post)}

        <div class="post-user">

          <strong>
            ${esc(
              post.display_name
            )}

            ${
              post.verified
                ? `
                  <span class="verified">
                    <i data-lucide="badge-check"></i>
                  </span>
                `
                : ""
            }

          </strong>

          <span>
            @${esc(
              post.username
            )}
            ·
            ${timeAgo(
              post.created_at
            )}
          </span>

        </div>

        <button
          class="more"
          data-menu="${esc(
            post.id
          )}"
        >
          <i data-lucide="more-horizontal"></i>
        </button>

      </div>

      <div class="post-text">
        ${richText(
          post.text
        )}
      </div>

      ${
        post.image
          ? `
            <img
              class="post-image"
              src="${esc(
                post.image
              )}"
              alt=""
              loading="lazy"
            >
          `
          : ""
      }

      <div class="actions">

        <button
          class="${
            post.liked
              ? "liked"
              : ""
          }"
          data-action="like"
          data-id="${esc(
            post.id
          )}"
        >
          <i data-lucide="heart"></i>
          <span>
            ${fmt(
              post.likes
            )}
          </span>
        </button>

        <button
          data-action="comment"
          data-id="${esc(
            post.id
          )}"
        >
          <i data-lucide="message-circle"></i>
          <span>
            ${fmt(
              post.comments
            )}
          </span>
        </button>

        <button
          class="${
            post.reposted
              ? "reposted"
              : ""
          }"
          data-action="repost"
          data-id="${esc(
            post.id
          )}"
        >
          <i data-lucide="repeat-2"></i>
          <span>
            ${fmt(
              post.reposts
            )}
          </span>
        </button>

        <button
          class="${
            post.bookmarked
              ? "bookmarked"
              : ""
          }"
          data-action="bookmark"
          data-id="${esc(
            post.id
          )}"
        >
          <i data-lucide="bookmark"></i>
        </button>

        <button
          class="views"
          data-action="view"
          data-id="${esc(
            post.id
          )}"
        >
          <i data-lucide="eye"></i>
          <span>
            ${fmt(
              post.views
            )}
          </span>
        </button>

      </div>

    </article>
  `;
}

function renderPosts(
  list = posts,
  target = $("feed")
) {
  if (!list.length) {
    target.innerHTML = `
      <div class="empty-feed">

        <i data-lucide="file-text"></i>

        <h2>No posts yet</h2>

        <p>
          Create a post and it will appear here.
        </p>

      </div>
    `;

    refreshIcons();

    return;
  }

  target.innerHTML =
    list
      .map(
        postCardMarkup
      )
      .join("");

  refreshIcons();
}

function findPost(id) {
  return posts.find(
    post =>
      String(post.id) ===
      String(id)
  );
}

async function postAction(
  action,
  id
) {
  const post =
    findPost(id);

  if (
    !post ||
    !currentUser.id
  ) {
    return;
  }

  if (
    action === "comment"
  ) {
    openComments(id);
    return;
  }

  if (
    action === "view"
  ) {
    increasePostView(id);
    return;
  }

  try {
    const table =
      action === "like"
        ? "likes"
        : action === "repost"
          ? "reposts"
          : "bookmarks";

    const existing =
      await supabaseClient
        .from(table)
        .select("id")
        .eq(
          "post_id",
          id
        )
        .eq(
          "user_id",
          currentUser.id
        )
        .maybeSingle();

    if (existing.error) {
      throw existing.error;
    }

    if (existing.data) {
      const result =
        await supabaseClient
          .from(table)
          .delete()
          .eq(
            "id",
            existing.data.id
          );

      if (result.error) {
        throw result.error;
      }
    } else {
      const result =
        await supabaseClient
          .from(table)
          .insert({
            post_id: id,
            user_id:
              currentUser.id
          });

      if (result.error) {
        throw result.error;
      }
    }

    await loadData();

    renderPosts();
    renderProfilePosts();
    renderTrending();

  } catch (error) {
    console.error(
      error
    );

    toast(
      error.message ||
        "Action failed."
    );
  }
}

function renderProfile() {
  const user =
    getUser();

  $("profileHero").innerHTML = `
    <div class="profile-card">

      ${avatarMarkup(
        user,
        "profile-avatar"
      )}

      <div>

        <h1>
          ${esc(
            user.display_name
          )}
        </h1>

        <p>
          @${esc(
            user.username
          )}
        </p>

        <span>
          ${esc(
            user.bio ||
              "Welcome to ARS."
          )}
        </span>

      </div>

    </div>
  `;

  renderProfilePosts();
}

function renderProfilePosts() {
  const element =
    $("profilePostsList");

  if (!element) {
    return;
  }

  renderPosts(
    posts.filter(
      post =>
        String(
          post.user_id
        ) ===
        String(
          getUser().id
        )
    ),
    element
  );
}

function extractTrendCounts() {
  const counts = {};

  posts.forEach(
    post => {
      (
        post.hashtags ||
        extractHashtags(
          post.text
        )
      ).forEach(
        tag => {
          counts[tag] =
            (counts[tag] ||
              0) + 1;
        }
      );
    }
  );

  return counts;
}

function renderTrending() {
  const items =
    Object.entries(
      extractTrendCounts()
    )
      .sort(
        (a, b) =>
          b[1] - a[1]
      )
      .slice(0, 10);

  $("trendingList").innerHTML =
    items.length
      ? items
          .map(
            (
              [tag, count],
              index
            ) => `
              <button
                class="trend"
                data-trending-tag="${e
                                     sc(tag)}"
              >
                <span>#</span>
                <div>
                  <strong>#${esc(tag)}</strong>
                  <span>${count} posts</span>
                </div>
                <i data-lucide="chevron-right"></i>
              </button>
            `;
          })
          .join("");

        trendingList.innerHTML =
          html ||
          `
            <div class="empty-state compact">
              <i data-lucide="flame"></i>
              <h2>No trends yet</h2>
              <p>Hashtags will appear here when people start posting.</p>
            </div>
          `;

        refreshIcons();
      }

      function renderSearchResults(results) {
        const container = $("searchResults");
        if (!container) return;

        if (!results.length) {
          container.innerHTML = `
            <div class="empty-state compact">
              <i data-lucide="search"></i>
              <h2>No results</h2>
              <p>Try another name, username, or hashtag.</p>
            </div>
          `;

          refreshIcons();
          return;
        }

        container.innerHTML = results
          .map(
            (user) => `
              <button
                class="search-result"
                type="button"
                data-user-id="${esc(user.id)}"
              >
                <div class="avatar search-avatar">
                  ${avatarMarkup(user, "avatar")}
                </div>

                <div>
                  <strong>${esc(
                    user.display_name || user.username || "User"
                  )}</strong>

                  <span>
                    @${esc(user.username || "user")}
                  </span>

                  ${
                    user.bio
                      ? `<p>${esc(user.bio)}</p>`
                      : ""
                  }
                </div>
              </button>
            `
          )
          .join("");

        refreshIcons();
      }

      function renderPosts() {
        const feed = $("feed");
        if (!feed) return;

        if (!state.posts.length) {
          feed.innerHTML = `
            <div class="empty-feed">
              <i data-lucide="message-circle"></i>
              <h2>No posts yet</h2>
              <p>Be the first person to post on ARS.</p>
            </div>
          `;

          refreshIcons();
          return;
        }

        feed.innerHTML = state.posts
          .map((post) => postMarkup(post))
          .join("");

        refreshIcons();
      }

      function renderStories() {
        const container = $("stories");
        if (!container) return;

        const grouped = new Map();

        for (const story of state.stories) {
          if (!story.user_id) continue;

          if (!grouped.has(story.user_id)) {
            grouped.set(story.user_id, []);
          }

          grouped.get(story.user_id).push(story);
        }

        const users = [];

        for (const [userId, stories] of grouped) {
          const first = stories[0];

          users.push({
            id: userId,
            user: first.user || {},
            stories
          });
        }

        if (
          state.currentUser &&
          !grouped.has(state.currentUser.id)
        ) {
          users.unshift({
            id: state.currentUser.id,
            user: state.currentUser,
            stories: []
          });
        }

        if (!users.length) {
          container.innerHTML = "";
          return;
        }

        container.innerHTML = users
          .map(({ user, stories, id }) => {
            const isOwn =
              id === state.currentUser?.id;

            return `
              <button
                class="story-item"
                type="button"
                data-story-user="${esc(id)}"
              >
                <div class="avatar story-avatar">
                  ${avatarMarkup(
                    user,
                    "avatar"
                  )}
                </div>

                ${
                  isOwn
                    ? `
                      <span class="story-plus">
                        <i data-lucide="plus"></i>
                      </span>
                    `
                    : ""
                }

                <span class="story-name">
                  ${esc(
                    isOwn
                      ? "You"
                      : user.display_name ||
                          user.username ||
                          "User"
                  )}
                </span>
              </button>
            `;
          })
          .join("");

        refreshIcons();
      }

      function renderAll() {
        renderStories();
        renderPosts();
        renderTrending();

        if (state.searchQuery) {
          performSearch(state.searchQuery);
        }
      }

      async function loadCurrentUser() {
        const {
          data: { user },
          error
        } = await supabaseClient.auth.getUser();

        if (error) {
          console.error(
            "Unable to get current user:",
            error
          );
          return null;
        }

        if (!user) return null;

        const { data: profile, error: profileError } =
          await supabaseClient
            .from("users")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();

        if (profileError) {
          console.error(
            "Unable to load profile:",
            profileError
          );
        }

        return (
          profile || {
            id: user.id,
            email: user.email || "",
            username:
              user.user_metadata?.username || "",
            display_name:
              user.user_metadata?.display_name || ""
          }
        );
      }

      async function loadPosts() {
        const { data, error } = await supabaseClient
          .from("posts")
          .select(`
            *,
            users:user_id (
              id,
              username,
              display_name,
              avatar,
              verified,
              plan
            )
          `)
          .order("created_at", {
            ascending: false
          });

        if (error) {
          console.error(
            "Unable to load posts:",
            error
          );
          state.posts = [];
          return;
        }

        state.posts = Array.isArray(data)
          ? data.map(normalizePost)
          : [];
      }

      async function loadStories() {
        const { data, error } = await supabaseClient
          .from("stories")
          .select(`
            *,
            users:user_id (
              id,
              username,
              display_name,
              avatar,
              verified,
              plan
            )
          `)
          .order("created_at", {
            ascending: false
          });

        if (error) {
          console.error(
            "Unable to load stories:",
            error
          );
          state.stories = [];
          return;
        }

        state.stories = Array.isArray(data)
          ? data
          : [];
      }

      async function loadData() {
        try {
          setLoading(true);

          state.currentUser =
            await loadCurrentUser();

          await Promise.all([
            loadPosts(),
            loadStories()
          ]);

          renderAll();
          updateCurrentUserUI();
        } catch (error) {
          console.error(
            "ARS Home load error:",
            error
          );

          showToast(
            "Unable to load ARS right now."
          );
        } finally {
          setLoading(false);
        }
      }

      function updateCurrentUserUI() {
        if (!state.currentUser) return;

        const user = state.currentUser;

        const topAvatar = $("topAvatar");

        if (topAvatar) {
          topAvatar.innerHTML =
            avatarMarkup(user, "avatar");
        }

        const composeAvatar =
          $("composeAvatar");

        if (composeAvatar) {
          composeAvatar.innerHTML =
            avatarMarkup(user, "avatar");
        }
      }

      function openPostComposer() {
        const overlay = $("composeOverlay");
        if (!overlay) return;

        overlay.classList.add("open");

        const input = $("postContent");

        if (input) {
          input.focus();
        }
      }

      function closePostComposer() {
        const overlay = $("composeOverlay");

        if (!overlay) return;

        overlay.classList.remove("open");
      }

      function openStoryEditor() {
        const overlay = $("storyOverlay");

        if (!overlay) return;

        overlay.classList.add("open");

        resetStoryEditor();
      }

      function closeStoryEditor() {
        const overlay = $("storyOverlay");

        if (!overlay) return;

        overlay.classList.remove("open");
      }

      function resetStoryEditor() {
        const input = $("storyImageInput");
        const text = $("storyTextInput");
        const preview = $("storyImagePreview");
        const empty = $("storyCanvasEmpty");
        const textPreview = $("storyTextPreview");

        if (input) input.value = "";
        if (text) text.value = "";

        if (preview) {
          preview.removeAttribute("src");
          preview.style.display = "none";
        }

        if (empty) {
          empty.style.display = "flex";
        }

        if (textPreview) {
          textPreview.textContent = "";
        }
      }

      async function publishPost() {
        if (!state.currentUser) {
          showToast("Please log in first.");
          return;
        }

        const input = $("postContent");

        if (!input) return;

        const content = input.value.trim();

        if (!content) {
          showToast("Write something first.");
          return;
        }

        const imageUrl =
          state.composeImageUrl || null;

        const payload = {
          user_id: state.currentUser.id,
          content,
          image: imageUrl
        };

        const { data, error } =
          await supabaseClient
            .from("posts")
            .insert(payload)
            .select(`
              *,
              users:user_id (
                id,
                username,
                display_name,
                avatar,
                verified,
                plan
              )
            `)
            .single();

        if (error) {
          console.error(
            "Post creation failed:",
            error
          );

          showToast(
            error.message ||
              "Unable to publish post."
          );

          return;
        }

        state.posts.unshift(
          normalizePost(data)
        );

        input.value = "";
        state.composeImageUrl = null;

        const preview = $("postImagePreview");

        if (preview) {
          preview.innerHTML = "";
        }

        closePostComposer();
        renderPosts();
        renderTrending();

        showToast("Post published.");
      }

      async function publishStory() {
        if (!state.currentUser) {
          showToast("Please log in first.");
          return;
        }

        const imageInput =
          $("storyImageInput");

        const textInput =
          $("storyTextInput");

        const file =
          imageInput?.files?.[0];

        const text =
          textInput?.value?.trim() || "";

        if (!file && !text) {
          showToast(
            "Add an image or text first."
          );
          return;
        }

        let imageUrl = null;

        if (file) {
          const extension =
            file.name.split(".").pop() ||
            "jpg";

          const path =
            `${state.currentUser.id}/${Date.now()}.${extension}`;

          const upload =
            await supabaseClient.storage
              .from("stories")
              .upload(path, file, {
                upsert: false,
                contentType: file.type
              });

          if (upload.error) {
            console.error(
              "Story upload failed:",
              upload.error
            );

            showToast(
              upload.error.message ||
                "Unable to upload story."
            );

            return;
          }

          const {
            data: publicData
          } = supabaseClient.storage
            .from("stories")
            .getPublicUrl(path);

          imageUrl =
            publicData?.publicUrl || null;
        }

        const payload = {
          user_id: state.currentUser.id,
          image: imageUrl,
          text
        };

        const { data, error } =
          await supabaseClient
            .from("stories")
            .insert(payload)
            .select(`
              *,
              users:user_id (
                id,
                username,
                display_name,
                avatar,
                verified,
                plan
              )
            `)
            .single();

        if (error) {
          console.error(
            "Story creation failed:",
            error
          );

          showToast(
            error.message ||
              "Unable to publish story."
          );

          return;
        }

        state.stories.unshift(data);

        closeStoryEditor();
        renderStories();

        showToast("Story published.");
      }

      function bindImagePreview() {
        const input =
          $("postImageInput");

        if (!input) return;

        input.addEventListener(
          "change",
          () => {
            const file =
              input.files?.[0];

            const preview =
              $("postImagePreview");

            if (!preview) return;

            preview.innerHTML = "";

            if (!file) {
              state.composeImageUrl = null;
              return;
            }

            const reader =
              new FileReader();

            reader.onload = () => {
              state.composeImageUrl =
                reader.result;

              preview.innerHTML = `
                <div class="preview-wrap">
                  <img
                    src="${esc(reader.result)}"
                    alt=""
                  >

                  <button
                    type="button"
                    class="remove-media"
                    id="removePostImage"
                  >
                    <i data-lucide="x"></i>
                  </button>
                </div>
              `;

              refreshIcons();

              $("removePostImage")
                ?.addEventListener(
                  "click",
                  () => {
                    input.value = "";
                    state.composeImageUrl =
                      null;

                    preview.innerHTML = "";
                  }
                );
            };

            reader.readAsDataURL(file);
          }
        );
      }

      function bindStoryPreview() {
        const input =
          $("storyImageInput");

        if (!input) return;

        input.addEventListener(
          "change",
          () => {
            const file =
              input.files?.[0];

            const preview =
              $("storyImagePreview");

            const empty =
              $("storyCanvasEmpty");

            if (!preview) return;

            if (!file) {
              preview.removeAttribute(
                "src"
              );

              preview.style.display =
                "none";

              if (empty) {
                empty.style.display =
                  "flex";
              }

              return;
            }

            const reader =
              new FileReader();

            reader.onload = () => {
              preview.src =
                reader.result;

              preview.style.display =
                "block";

              if (empty) {
                empty.style.display =
                  "none";
              }
            };

            reader.readAsDataURL(file);
          }
        );

        const textInput =
          $("storyTextInput");

        const textPreview =
          $("storyTextPreview");

        if (
          textInput &&
          textPreview
        ) {
          textInput.addEventListener(
            "input",
            () => {
              textPreview.textContent =
                textInput.value;
            }
          );
        }
      }

      function bindNavigation() {
        document
          .querySelectorAll(
            ".nav-item[data-page]"
          )
          .forEach((button) => {
            button.addEventListener(
              "click",
              () => {
                const page =
                  button.dataset.page;

                if (!page) return;

                showPage(page);
              }
            );
          });
      }

      function showPage(pageName) {
        document
          .querySelectorAll(".page")
          .forEach((page) => {
            page.classList.toggle(
              "active",
              page.id ===
                `page-${pageName}`
            );
          });

        document
          .querySelectorAll(
            ".nav-item[data-page]"
          )
          .forEach((button) => {
            button.classList.toggle(
              "active",
              button.dataset.page ===
                pageName
            );
          });

        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });

        if (
          pageName === "trending"
        ) {
          renderTrending();
        }

        if (
          pageName === "search"
        ) {
          $("searchInput")?.focus();
        }
      }

      function bindGlobalEvents() {
        $("createPostButton")
          ?.addEventListener(
            "click",
            openPostComposer
          );

        $("closeCompose")
          ?.addEventListener(
            "click",
            closePostComposer
          );

        $("publishPost")
          ?.addEventListener(
            "click",
            publishPost
          );

        $("postImageInput")
          ?.addEventListener(
            "change",
            bindImagePreview
          );

        $("createStoryButton")
          ?.addEventListener(
            "click",
            openStoryEditor
          );

        $("closeStory")
          ?.addEventListener(
            "click",
            closeStoryEditor
          );

        $("publishStory")
          ?.addEventListener(
            "click",
            publishStory
          );

        $("storyImageInput")
          ?.addEventListener(
            "change",
            bindStoryPreview
          );

        $("wheelButton")
          ?.addEventListener(
            "click",
            () => {
              showPage("wheel");
            }
          );

        $("searchInput")
          ?.addEventListener(
            "input",
            (event) => {
              state.searchQuery =
                event.target.value
                  .trim();

              performSearch(
                state.searchQuery
              );
            }
          );

        $("refreshFeed")
          ?.addEventListener(
            "click",
            loadData
          );

        $("logoutButton")
          ?.addEventListener(
            "click",
            async () => {
              await supabaseClient.auth.signOut();

              window.location.href =
                "index.html";
            }
          );

        document.addEventListener(
          "click",
          handleDocumentClick
        );
      }

      function handleDocumentClick(
        event
      ) {
        const storyButton =
          event.target.
