const SUPABASE_URL = "https://bfqsqgfyyewnfxekirfv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_OM-LGm9LZCtmzkGYmpyA8A_jnvgmH1-";

const supabaseClient = window.supabase.createClient(
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

const $ = (id) => document.getElementById(id);

const state = {
  user: null,
  posts: [],
  stories: [],
  comments: new Map(),

  searchQuery: "",

  postImageData: null,

  storyMediaData: null,
  storyMediaType: "image",
  storyFile: null,

  currentStoryGroup: [],
  currentStoryIndex: 0,

  currentPostId: null,

  wheelRotation: 0,
  wheelSpins: 0,

  initialized: false,
  loading: false
};

const ARS_WHEEL_FREE_SPINS = 2;
const ARS_WHEEL_STORAGE_KEY =
  "ars_wheel_spins";

const WHEEL_CHALLENGES = [
  {
    title: "Post something today",
    category: "Post",
    reward: 20
  },
  {
    title: "Share a story",
    category: "Story",
    reward: 20
  },
  {
    title: "Like three posts",
    category: "Engagement",
    reward: 15
  },
  {
    title: "Use a hashtag",
    category: "Explore",
    reward: 10
  },
  {
    title: "Leave a comment",
    category: "Community",
    reward: 15
  },
  {
    title: "Keep your streak alive",
    category: "Streak",
    reward: 25
  }
];

function safeError(
  feature,
  error
) {
  console.error(
    `[ARS:${feature}]`,
    error
  );

  if (
    window.ARSErrors &&
    typeof window.ARSErrors.capture ===
      "function"
  ) {
    try {
      window.ARSErrors.capture(
        error,
        feature
      );
    } catch (_) {}
  }
}

function safeRun(
  feature,
  callback
) {
  try {
    return callback();
  } catch (error) {
    safeError(
      feature,
      error
    );

    return null;
  }
}

async function safeRunAsync(
  feature,
  callback
) {
  try {
    return await callback();
  } catch (error) {
    safeError(
      feature,
      error
    );

    return null;
  }
}

const escapeHtml = (
  value
) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[char]
  );

function refreshIcons() {
  safeRun(
    "icons",
    () => {
      window.lucide?.createIcons?.();
    }
  );
}

function formatCount(
  value
) {
  const number =
    Number(value || 0);

  if (number >= 1000000) {
    return `${(
      number / 1000000
    )
      .toFixed(1)
      .replace(".0", "")}M`;
  }

  if (number >= 1000) {
    return `${(
      number / 1000
    )
      .toFixed(1)
      .replace(".0", "")}K`;
  }

  return String(number);
}

function timeAgo(
  value
) {
  if (!value) {
    return "";
  }

  const time =
    new Date(
      value
    ).getTime();

  if (
    !Number.isFinite(time)
  ) {
    return "";
  }

  const seconds =
    Math.max(
      0,
      Math.floor(
        (Date.now() -
          time) /
          1000
      )
    );

  if (seconds < 60) {
    return `${seconds}s`;
  }

  if (seconds < 3600) {
    return `${Math.floor(
      seconds / 60
    )}m`;
  }

  if (seconds < 86400) {
    return `${Math.floor(
      seconds / 3600
    )}h`;
  }

  if (seconds < 604800) {
    return `${Math.floor(
      seconds / 86400
    )}d`;
  }

  return new Date(
    value
  ).toLocaleDateString(
    undefined,
    {
      month: "short",
      day: "numeric"
    }
  );
}

function showToast(
  message
) {
  const element =
    $("toast");

  if (!element) {
    return;
  }

  element.textContent =
    message;

  element.classList.add(
    "show"
  );

  clearTimeout(
    window.__arsToastTimer
  );

  window.__arsToastTimer =
    setTimeout(
      () =>
        element.classList.remove(
          "show"
        ),
      2400
    );
}

function getLocalProfileSettings() {
  return {
    letter: (
      localStorage.getItem(
        "ars_letter"
      ) || "R"
    )
      .slice(0, 1)
      .toUpperCase(),

    letterColor:
      localStorage.getItem(
        "ars_letter_color"
      ) || "#8d2cff"
  };
}

function avatarMarkup(
  user = {},
  className = "avatar"
) {
  const settings =
    getLocalProfileSettings();

  const avatar =
    typeof user.avatar ===
    "string"
      ? user.avatar
      : "";

  const isImage =
    /^(https?:|data:image|blob:)/i.test(
      avatar
    );

  if (isImage) {
    return `
      <div class="${escapeHtml(
        className
      )}">
        <img
          src="${escapeHtml(
            avatar
          )}"
          alt=""
        >
      </div>
    `;
  }

  const letter =
    String(
      user.letter ||
        user.display_name ||
        settings.letter ||
        "R"
    )
      .slice(0, 1)
      .toUpperCase();

  const color =
    user.letterColor ||
    user.letter_color ||
    settings.letterColor;

  return `
    <div
      class="${escapeHtml(
        className
      )}"
      style="--avatar:${escapeHtml(
        color
      )}"
    >
      <span>
        ${escapeHtml(
          letter
        )}
      </span>
    </div>
  `;
}

function normalizeUser(
  user = {}
) {
  const settings =
    getLocalProfileSettings();

  return {
    id: user.id || "",

    username:
      user.username ||
      "you",

    display_name:
      user.display_name ||
      "You",

    email:
      user.email || "",

    bio:
      user.bio || "",

    avatar:
      user.avatar || "",

    verified:
      Boolean(
        user.verified
      ),

    plan:
      user.plan ||
      "free",

    streak:
      Number(
        user.streak || 0
      ),

    xp:
      Number(
        user.xp || 0
      ),

    letter:
      user.letter ||
      settings.letter,

    letterColor:
      user.letterColor ||
      user.letter_color ||
      settings.letterColor
  };
}

function normalizePost(
  row = {}
) {
  return {
    id: row.id,

    user_id:
      row.user_id,

    content:
      row.content || "",

    image:
      row.image || "",

    created_at:
      row.created_at,

    likes_count:
      Number(
        row.likes_count || 0
      ),

    comments_count:
      Number(
        row.comments_count || 0
      ),

    reposts_count:
      Number(
        row.reposts_count || 0
      ),

    views_count:
      Number(
        row.views_count || 0
      ),

    liked:
      Boolean(
        row.liked
      ),

    reposted:
      Boolean(
        row.reposted
      ),

    bookmarked:
      Boolean(
        row.bookmarked
      ),

    user:
      normalizeUser(
        row.users ||
          row.user ||
          {}
      )
  };
}

function normalizeStory(
  row = {}
) {
  const mediaType =
    row.media_type ||
    (
      String(
        row.image || ""
      ).startsWith(
        "data:video/"
      )
        ? "video"
        : "image"
    );

  return {
    id: row.id,

    user_id:
      row.user_id,

    image:
      row.image || "",

    media_type:
      mediaType,

    story_text:
      row.story_text ||
      "",

    text_position:
      row.text_position ||
      "center",

    text_color:
      row.text_color ||
      "#ffffff",

    filter:
      row.filter ||
      "none",

    sticker:
      row.sticker ||
      "",

    zoom:
      Number(
        row.zoom || 1
      ),

    created_at:
      row.created_at,

    expires_at:
      row.expires_at,

    viewers_count:
      Number(
        row.viewers_count ||
          0
      ),

    user:
      normalizeUser(
        row.users ||
          row.user ||
          {}
      )
  };
}

function hashtagsFromText(
  text
) {
  return [
    ...String(
      text || ""
    ).matchAll(
      /(^|\s)#([A-Za-z0-9_]+)/g
    )
  ].map(
    (match) =>
      match[2].toLowerCase()
  );
}

function renderRichText(
  text
) {
  const safe =
    escapeHtml(text);

  return safe.replace(
    /(^|\s)(#[A-Za-z0-9_]+)/g,
    '$1<button type="button" class="hashtag" data-hashtag="$2">$2</button>'
  );
}

async function requireSession() {
  const {
    data,
    error
  } =
    await supabaseClient.auth.getSession();

  if (error) {
    throw error;
  }

  if (
    !data.session?.user
  ) {
    window.location.replace(
      "index.html"
    );

    return null;
  }

  return data.session.user;
}

async function loadCurrentUser() {
  const authUser =
    await requireSession();

  if (!authUser) {
    return null;
  }

  const {
    data,
    error
  } =
    await supabaseClient
      .from("users")
      .select("*")
      .eq(
        "id",
        authUser.id
      )
      .maybeSingle();

  if (error) {
    throw error;
  }

  const metadata =
    authUser.user_metadata ||
    {};

  const user =
    normalizeUser(
      data || {
        id: authUser.id,

        email:
          authUser.email ||
          "",

        username:
          metadata.username ||
          "you",

        display_name:
          metadata.display_name ||
          "You"
      }
    );

  localStorage.setItem(
    "ars_user",
    JSON.stringify(
      user
    )
  );

  localStorage.setItem(
    "ars_plan",
    user.plan
  );

  return user;
}

async function loadPosts() {
  const {
    data,
    error
  } =
    await supabaseClient
      .from("posts")
      .select(`
        id,
        created_at,
        user_id,
        content,
        image,
        likes_count,
        comments_count,
        reposts_count,
        views_count,
        users:user_id(
          id,
          username,
          display_name,
          avatar,
          verified,
          plan
        )
      `)
      .order(
        "created_at",
        {
          ascending: false
        }
      );

  if (error) {
    throw error;
  }

  state.posts =
    (data || []).map(
      normalizePost
    );

  await hydratePostActions();
}

async function hydratePostActions() {
  if (
    !state.user?.id ||
    !state.posts.length
  ) {
    return;
  }

  const ids =
    state.posts.map(
      (post) =>
        post.id
    );

  const [
    likes,
    reposts,
    bookmarks
  ] =
    await Promise.all([
      supabaseClient
        .from("likes")
        .select(
          "post_id"
        )
        .eq(
          "user_id",
          state.user.id
        )
        .in(
          "post_id",
          ids
        ),

      supabaseClient
        .from("reposts")
        .select(
          "post_id"
        )
        .eq(
          "user_id",
          state.user.id
        )
        .in(
          "post_id",
          ids
        ),

      supabaseClient
        .from("bookmarks")
        .select(
          "post_id"
        )
        .eq(
          "user_id",
          state.user.id
        )
        .in(
          "post_id",
          ids
        )
    ]);

  if (likes.error) {
    throw likes.error;
  }

  if (reposts.error) {
    throw reposts.error;
  }

  if (bookmarks.error) {
    throw bookmarks.error;
  }

  const liked =
    new Set(
      (likes.data || [])
        .map(
          (row) =>
            String(
              row.post_id
            )
        )
    );

  const reposted =
    new Set(
      (reposts.data || [])
        .map(
          (row) =>
            String(
              row.post_id
            )
        )
    );

  const bookmarked =
    new Set(
      (bookmarks.data || [])
        .map(
          (row) =>
            String(
              row.post_id
            )
        )
    );

  state.posts.forEach(
    (post) => {
      post.liked =
        liked.has(
          String(
            post.id
          )
        );

      post.reposted =
        reposted.has(
          String(
            post.id
          )
        );

      post.bookmarked =
        bookmarked.has(
          String(
            post.id
          )
        );
    }
  );
}

async function loadStories() {
  const {
    data,
    error
  } =
    await supabaseClient
      .from("stories")
      .select(`
        id,
        created_at,
        user_id,
        image,
        viewers_count,
        expires_at,
        media_type,
        story_text,
        text_position,
        text_color,
        filter,
        sticker,
        zoom,
        users:user_id(
          id,
          username,
          display_name,
          avatar,
          verified,
          plan
        )
      `)
      .or(
        `expires_at.is.null,expires_at.gt.${new Date().toISOString()}`
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      );

  if (error) {
    throw error;
  }

  state.stories =
    (data || []).map(
      normalizeStory
    );
}

async function loadAll() {
  state.loading =
    true;

  try {
    state.user =
      await loadCurrentUser();

    if (!state.user) {
      return;
    }

    await Promise.all([
      loadPosts(),
      loadStories()
    ]);

    renderAll();
    updateUserUI();

  } catch (error) {
    safeError(
      "load",
      error
    );

    showToast(
      error.message ||
        "Unable to load ARS."
    );

  } finally {
    state.loading =
      false;
  }
}

function updateUserUI() {
  const profileButton =
    $("profileButton");

  if (profileButton) {
    profileButton.innerHTML =
      avatarMarkup(
        state.user,
        "avatar top-avatar"
      );
  }

  const composeAvatar =
    $("composeAvatar");

  if (composeAvatar) {
    composeAvatar.innerHTML =
      avatarMarkup(
        state.user,
        "avatar"
      );
  }

  refreshIcons();
}

function renderStories() {
  const container =
    $("stories");

  if (!container) {
    return;
  }

  const groups =
    new Map();

  state.stories.forEach(
    (story) => {
      if (
        !story.user_id
      ) {
        return;
      }

      if (
        !groups.has(
          story.user_id
        )
      ) {
        groups.set(
          story.user_id,
          []
        );
      }

      groups
        .get(
          story.user_id
        )
        .push(story);
    }
  );

  if (
    state.user?.id &&
    !groups.has(
      state.user.id
    )
  ) {
    groups.set(
      state.user.id,
      []
    );
  }

  const entries =
    [...groups.entries()];

  entries.sort(
    ([a], [b]) =>
      String(a) ===
      String(
        state.user?.id
      )
        ? -1
        : String(b) ===
            String(
              state.user?.id
            )
          ? 1
          : 0
  );

  container.innerHTML =
    entries
      .map(
        ([userId, stories]) => {
          const user =
            stories[0]?.user ||
            (
              String(
                userId
              ) ===
              String(
                state.user?.id
              )
                ? state.user
                : {}
            );

          const own =
            String(
              userId
            ) ===
            String(
              state.user?.id
            );

          return `
            <button
              type="button"
              class="story-item"
              data-story-user="${escapeHtml(
                userId
              )}"
            >

              <span
                class="story-ring"
              >
                ${avatarMarkup(
                  user,
                  "story-avatar"
                )}
              </span>

              ${
                own
                  ? `
                    <span class="story-plus">
                      <i data-lucide="plus"></i>
                    </span>
                  `
                  : ""
              }

              <span class="story-name">
                ${escapeHtml(
                  own
                    ? "You"
                    : user.display_name ||
                        user.username ||
                        "User"
                )}
              </span>

            </button>
          `;
        }
      )
      .join("");

  refreshIcons();
}

function postMarkup(
  post
) {
  return `
    <article
      class="post-card"
      data-post-id="${escapeHtml(
        post.id
      )}"
    >

      <div class="post-head">

        <button
          type="button"
          class="post-avatar-button"
          data-profile-user="${escapeHtml(
            post.user_id
          )}"
        >
          ${avatarMarkup(
            post.user,
            "post-avatar"
          )}
        </button>

        <button
          type="button"
          class="post-user"
          data-profile-user="${escapeHtml(
            post.user_id
          )}"
        >

          <strong>
            ${escapeHtml(
              post.user.display_name
            )}

            ${
              post.user.verified
                ? `
                  <span class="verified">
                    <i data-lucide="badge-check"></i>
                  </span>
                `
                : ""
            }
          </strong>

          <span>
            @${escapeHtml(
              post.user.username
            )}
            ·
            ${escapeHtml(
              timeAgo(
                post.created_at
              )
            )}
          </span>

        </button>

        <button
          type="button"
          class="more"
          data-post-menu="${escapeHtml(
            post.id
          )}"
        >
          <i data-lucide="more-horizontal"></i>
        </button>

      </div>

      ${
        post.content
          ? `
            <div class="post-text">
              ${renderRichText(
                post.content
              )}
            </div>
          `
          : ""
      }

      ${
        post.image
          ? `
            <img
              class="post-image"
              src="${escapeHtml(
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
          type="button"
          class="${
            post.liked
              ? "liked"
              : ""
          }"
          data-action="like"
          data-id="${escapeHtml(
            post.id
          )}"
        >
          <i data-lucide="heart"></i>
          <span>
            ${formatCount(
              post.likes_count
            )}
          </span>
        </button>

        <button
          type="button"
          data-action="comment"
          data-id="${escapeHtml(
            post.id
          )}"
        >
          <i data-lucide="message-circle"></i>
          <span>
            ${formatCount(
              post.comments_count
            )}
          </span>
        </button>

        <button
          type="button"
          class="${
            post.reposted
              ? "reposted"
              : ""
          }"
          data-action="repost"
          data-id="${escapeHtml(
            post.id
          )}"
        >
          <i data-lucide="repeat-2"></i>
          <span>
            ${formatCount(
              post.reposts_count
            )}
          </span>
        </button>

        <button
          type="button"
          class="${
            post.bookmarked
              ? "bookmarked"
              : ""
          }"
          data-action="bookmark"
          data-id="${escapeHtml(
            post.id
          )}"
        >
          <i data-lucide="bookmark"></i>
        </button>

        <button
          type="button"
          class="views"
          data-action="view"
          data-id="${escapeHtml(
            post.id
          )}"
        >
          <i data-lucide="eye"></i>
          <span>
            ${formatCount(
              post.views_count
            )}
          </span>
        </button>

      </div>

    </article>
  `;
}
function renderPosts(
  list = state.posts,
  target = $("feed")
) {
  if (!target) {
    return;
  }

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
  } else {
    target.innerHTML =
      list
        .map(
          postMarkup
        )
        .join("");
  }

  refreshIcons();
}

function renderProfile() {
  const target =
    $("profileHero");

  if (
    !target ||
    !state.user
  ) {
    return;
  }

  target.innerHTML = `
    <div class="profile-card">

      ${avatarMarkup(
        state.user,
        "profile-avatar"
      )}

      <div>

        <h1>
          ${escapeHtml(
            state.user
              .display_name
          )}
        </h1>

        <p>
          @${escapeHtml(
            state.user
              .username
          )}
        </p>

        ${
          state.user.bio
            ? `
              <span>
                ${escapeHtml(
                  state.user.bio
                )}
              </span>
            `
            : ""
        }

      </div>

    </div>
  `;

  renderPosts(
    state.posts.filter(
      (post) =>
        String(
          post.user_id
        ) ===
        String(
          state.user.id
        )
    ),
    $("profilePostsList")
  );
}

function buildHashtagCounts() {
  const counts =
    new Map();

  state.posts.forEach(
    (post) => {
      hashtagsFromText(
        post.content
      ).forEach(
        (tag) => {
          counts.set(
            tag,
            (counts.get(
              tag
            ) || 0) + 1
          );
        }
      );
    }
  );

  return counts;
}

function renderTrending() {
  const target =
    $("trendingList");

  if (!target) {
    return;
  }

  const counts =
    buildHashtagCounts();

  const rows =
    [...counts.entries()]
      .sort(
        (a, b) =>
          b[1] - a[1]
      )
      .slice(0, 20);

  if (!rows.length) {
    target.innerHTML = `
      <div class="empty-state compact">

        <i data-lucide="flame"></i>

        <h2>No trends yet</h2>

        <p>
          Hashtags will appear here when people start posting.
        </p>

      </div>
    `;

    refreshIcons();

    return;
  }

  target.innerHTML =
    rows
      .map(
        ([tag, count]) => `
          <button
            type="button"
            class="trend"
            data-trending-tag="${escapeHtml(
              tag
            )}"
          >

            <b>#</b>

            <div>

              <strong>
                #${escapeHtml(
                  tag
                )}
              </strong>

              <span>
                ${count} posts
              </span>

            </div>

            <i data-lucide="chevron-right"></i>

          </button>
        `
      )
      .join("");

  refreshIcons();
}

function renderSearchResultUser(
  user
) {
  return `
    <button
      type="button"
      class="search-result"
      data-search-user="${escapeHtml(
        user.id
      )}"
    >

      ${avatarMarkup(
        user,
        "search-avatar"
      )}

      <div>

        <strong>
          ${escapeHtml(
            user.display_name
          )}
        </strong>

        <span>
          @${escapeHtml(
            user.username
          )}
        </span>

      </div>

    </button>
  `;
}

function performSearch(
  query
) {
  const home =
    $("searchHome");

  const results =
    $("searchResults");

  if (
    !home ||
    !results
  ) {
    return;
  }

  const value =
    String(
      query || ""
    )
      .trim()
      .toLowerCase();

  if (!value) {
    home.style.display =
      "grid";

    results.innerHTML =
      "";

    return;
  }

  home.style.display =
    "none";

  const users =
    new Map();

  state.posts.forEach(
    (post) => {
      if (
        post.user?.id
      ) {
        users.set(
          String(
            post.user.id
          ),
          post.user
        );
      }
    }
  );

  if (state.user?.id) {
    users.set(
      String(
        state.user.id
      ),
      state.user
    );
  }

  const people =
    [...users.values()]
      .filter(
        (user) =>
          `${user.display_name} ${user.username}`
            .toLowerCase()
            .includes(value)
      );

  const matchingPosts =
    state.posts.filter(
      (post) =>
        `${post.content} ${post.user.display_name} ${post.user.username}`
          .toLowerCase()
          .includes(value)
    );

  const matchingTags =
    [
      ...new Set(
        state.posts.flatMap(
          (post) =>
            hashtagsFromText(
              post.content
            )
        )
      )
    ].filter(
      (tag) =>
        `#${tag}`.includes(
          value
        )
    );

  const html = [];

  people
    .slice(0, 10)
    .forEach(
      (user) => {
        html.push(
          renderSearchResultUser(
            user
          )
        );
      }
    );

  matchingTags
    .slice(0, 10)
    .forEach(
      (tag) => {
        html.push(`
          <button
            type="button"
            class="search-result"
            data-search-tag="${escapeHtml(
              tag
            )}"
          >

            <div>

              <strong>
                #${escapeHtml(
                  tag
                )}
              </strong>

              <span>
                Hashtag
              </span>

            </div>

          </button>
        `);
      }
    );

  matchingPosts
    .slice(0, 15)
    .forEach(
      (post) => {
        html.push(`
          <button
            type="button"
            class="search-result"
            data-search-post="${escapeHtml(
              post.id
            )}"
          >

            ${avatarMarkup(
              post.user,
              "search-avatar"
            )}

            <div>

              <strong>
                ${escapeHtml(
                  post.user
                    .display_name
                )}
              </strong>

              <p>
                ${escapeHtml(
                  post.content.slice(
                    0,
                    140
                  )
                )}
              </p>

            </div>

          </button>
        `);
      }
    );

  results.innerHTML =
    html.join("") ||
    `
      <div class="empty-state">

        <i data-lucide="search"></i>

        <h2>No results</h2>

        <p>
          Try another search.
        </p>

      </div>
    `;

  refreshIcons();
}

function showPage(
  pageId
) {
  document
    .querySelectorAll(
      ".page"
    )
    .forEach(
      (page) =>
        page.classList.toggle(
          "active",
          page.id ===
            pageId
        )
    );

  document
    .querySelectorAll(
      ".nav-item[data-page]"
    )
    .forEach(
      (button) =>
        button.classList.toggle(
          "active",
          button.dataset.page ===
            pageId
        )
    );

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  if (
    pageId ===
    "trendingPage"
  ) {
    renderTrending();
  }

  if (
    pageId ===
    "profilePage"
  ) {
    renderProfile();
  }

  if (
    pageId ===
    "streakPage"
  ) {
    renderStreak();
  }

  if (
    pageId ===
    "wheelPage"
  ) {
    renderWheel();
  }

  if (
    pageId ===
    "searchPage"
  ) {
    $("searchInput")
      ?.focus();
  }
}

function openModal(
  id
) {
  $(id)?.classList.add(
    "open"
  );
}

function closeModal(
  id
) {
  $(id)?.classList.remove(
    "open"
  );
}

function resetPostComposer() {
  state.postImageData =
    null;

  const text =
    $("createPostText");

  const input =
    $("createPostImage");

  const preview =
    $("postImagePreview");

  if (text) {
    text.value = "";
  }

  if (input) {
    input.value = "";
  }

  if (preview) {
    preview.innerHTML =
      "";
  }
}

function openPostComposer() {
  resetPostComposer();

  const composeAvatar =
    $("composeAvatar");

  if (composeAvatar) {
    composeAvatar.innerHTML =
      avatarMarkup(
        state.user,
        "avatar"
      );
  }

  openModal(
    "createPostModal"
  );

  refreshIcons();

  $("createPostText")
    ?.focus();
}

function resetStoryEditor() {
  state.storyMediaData =
    null;

  state.storyMediaType =
    "image";

  state.storyFile =
    null;

  const input =
    $("storyImage");

  const preview =
    $("storyImagePreview");

  const empty =
    $("storyCanvasEmpty");

  const text =
    $("storyText");

  const textPreview =
    $("storyTextPreview");

  if (input) {
    input.value = "";

    input.accept =
      "image/*,video/*";
  }

  if (preview) {
    preview.removeAttribute(
      "src"
    );

    preview.removeAttribute(
      "poster"
    );

    preview.style.display =
      "none";
  }

  if (empty) {
    empty.style.display =
      "flex";
  }

  if (text) {
    text.value = "";
  }

  if (textPreview) {
    textPreview.textContent =
      "";
  }

  const position =
    $("storyPosition");

  if (position) {
    position.value =
      "center";
  }

  const color =
    $("storyTextColor");

  if (color) {
    color.value =
      "#ffffff";
  }

  updateStoryEditorPreview();
}

function openStoryEditor() {
  resetStoryEditor();

  openModal(
    "createStoryModal"
  );

  refreshIcons();
}

function readFileAsDataUrl(
  file
) {
  return new Promise(
    (resolve, reject) => {
      const reader =
        new FileReader();

      reader.onload =
        () =>
          resolve(
            reader.result
          );

      reader.onerror =
        reject;

      reader.readAsDataURL(
        file
      );
    }
  );
}

function ensureStoryMediaInput() {
  const input =
    $("storyImage");

  if (!input) {
    return;
  }

  input.accept =
    "image/*,video/*";

  input.setAttribute(
    "capture",
    "environment"
  );
}

async function handleStoryFile(
  file
) {
  if (!file) {
    return;
  }

  const isVideo =
    file.type.startsWith(
      "video/"
    );

  const isImage =
    file.type.startsWith(
      "image/"
    );

  if (
    !isVideo &&
    !isImage
  ) {
    showToast(
      "Please choose an image or video."
    );

    return;
  }

  try {
    state.storyFile =
      file;

    state.storyMediaType =
      isVideo
        ? "video"
        : "image";

    state.storyMediaData =
      await readFileAsDataUrl(
        file
      );

    updateStoryEditorPreview();

  } catch (error) {
    safeError(
      "story-file",
      error
    );

    showToast(
      "Unable to read this file."
    );
  }
}

function updateStoryEditorPreview() {
  const canvas =
    $("storyCanvas");

  const empty =
    $("storyCanvasEmpty");

  const textPreview =
    $("storyTextPreview");

  const text =
    $("storyText")
      ?.value || "";

  const position =
    $("storyPosition")
      ?.value ||
    "center";

  const color =
    $("storyTextColor")
      ?.value ||
    "#ffffff";

  if (!canvas) {
    return;
  }

  let media =
    canvas.querySelector(
      ".ars-story-editor-media"
    );

  if (
    state.storyMediaData
  ) {
    if (
      state.storyMediaType ===
      "video"
    ) {
      if (
        !media ||
        media.tagName !==
          "VIDEO"
      ) {
        media?.remove();

        media =
          document.createElement(
            "video"
          );

        media.className =
          "ars-story-editor-media";

        media.muted =
          true;

        media.loop =
          true;

        media.autoplay =
          true;

        media.playsInline =
          true;

        canvas.prepend(
          media
        );
      }

      media.src =
        state.storyMediaData;

      media.style.display =
        "block";

    } else {
      if (
        !media ||
        media.tagName !==
          "IMG"
      ) {
        media?.remove();

        media =
          document.createElement(
            "img"
          );

        media.className =
          "ars-story-editor-media";

        canvas.prepend(
          media
        );
      }

      media.src =
        state.storyMediaData;

      media.style.display =
        "block";
    }

    if (empty) {
      empty.style.display =
        "none";
    }

  } else {
    media?.remove();

    if (empty) {
      empty.style.display =
        "flex";
    }
  }

  if (textPreview) {
    textPreview.textContent =
      text;

    textPreview.style.color =
      color;

    textPreview.style.top =
      position === "top"
        ? "20%"
        : position ===
            "bottom"
          ? "75%"
          : "45%";
  }

  refreshIcons();
}

async function publishPost() {
  const content =
    $("createPostText")
      ?.value.trim() ||
    "";

  if (
    !content &&
    !state.postImageData
  ) {
    showToast(
      "Write something or add an image."
    );

    return;
  }

  if (!state.user?.id) {
    showToast(
      "Please log in first."
    );

    return;
  }

  try {
    const {
      data,
      error
    } =
      await supabaseClient
        .from("posts")
        .insert({
          user_id:
            state.user.id,

          content,

          image:
            state.postImageData ||
            null
        })
        .select(`
          id,
          created_at,
          user_id,
          content,
          image,
          likes_count,
          comments_count,
          reposts_count,
          views_count,
          users:user_id(
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
      throw error;
    }

    state.posts.unshift(
      normalizePost(
        data
      )
    );

    closeModal(
      "createPostModal"
    );

    renderPosts();
    renderTrending();

    showToast(
      "Post published."
    );

  } catch (error) {
    safeError(
      "publish-post",
      error
    );

    showToast(
      error.message ||
        "Unable to publish post."
    );
  }
}

async function publishStory() {
  if (!state.user?.id) {
    showToast(
      "Please log in first."
    );

    return;
  }

  const text =
    $("storyText")
      ?.value.trim() ||
    "";

  if (
    !state.storyMediaData &&
    !text
  ) {
    showToast(
      "Add a photo, video, or text first."
    );

    return;
  }

  try {
    const position =
      $("storyPosition")
        ?.value ||
      "center";

    const color =
      $("storyTextColor")
        ?.value ||
      "#ffffff";

    const expiresAt =
      new Date(
        Date.now() +
          24 *
            60 *
            60 *
            1000
      ).toISOString();

    const payload = {
      user_id:
        state.user.id,

      image:
        state.storyMediaData ||
        null,

      media_type:
        state.storyMediaType,

      story_text:
        text,

      text_position:
        position,

      text_color:
        color,

      filter:
        "none",

      sticker:
        null,

      zoom:
        1,

      expires_at:
        expiresAt
    };

    const {
      data,
      error
    } =
      await supabaseClient
        .from("stories")
        .insert(
          payload
        )
        .select(`
          id,
          created_at,
          user_id,
          image,
          viewers_count,
          expires_at,
          media_type,
          story_text,
          text_position,
          text_color,
          filter,
          sticker,
          zoom,
          users:user_id(
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
      throw error;
    }

    state.stories.unshift(
      normalizeStory(
        data
      )
    );

    closeModal(
      "createStoryModal"
    );

    renderStories();

    showToast(
      "Story published."
    );

  } catch (error) {
    safeError(
      "publish-story",
      error
    );

    showToast(
      error.message ||
        "Unable to publish story."
    );
  }
      }
async function togglePostAction(
  action,
  postId
) {
  const post =
    state.posts.find(
      (item) =>
        String(
          item.id
        ) ===
        String(
          postId
        )
    );

  if (
    !post ||
    !state.user?.id
  ) {
    return;
  }

  if (
    action ===
    "comment"
  ) {
    openComments(
      postId
    );

    return;
  }

  if (
    action ===
    "view"
  ) {
    await incrementViews(
      post
    );

    return;
  }

  const table =
    action === "like"
      ? "likes"
      : action ===
          "repost"
        ? "reposts"
        : "bookmarks";

  try {
    const existing =
      await supabaseClient
        .from(table)
        .select("id")
        .eq(
          "post_id",
          postId
        )
        .eq(
          "user_id",
          state.user.id
        )
        .maybeSingle();

    if (existing.error) {
      throw existing.error;
    }

    if (existing.data) {
      const {
        error
      } =
        await supabaseClient
          .from(table)
          .delete()
          .eq(
            "id",
            existing.data.id
          );

      if (error) {
        throw error;
      }
    } else {
      const {
        error
      } =
        await supabaseClient
          .from(table)
          .insert({
            post_id:
              postId,

            user_id:
              state.user.id
          });

      if (error) {
        throw error;
      }
    }

    await loadPosts();

    renderPosts();
    renderTrending();

  } catch (error) {
    safeError(
      `post-${action}`,
      error
    );

    showToast(
      error.message ||
        "Action failed."
    );
  }
}

async function incrementViews(
  post
) {
  if (
    !post?.id
  ) {
    return;
  }

  const next =
    Number(
      post.views_count || 0
    ) + 1;

  post.views_count =
    next;

  renderPosts();

  const {
    error
  } =
    await supabaseClient
      .from("posts")
      .update({
        views_count:
          next
      })
      .eq(
        "id",
        post.id
      );

  if (error) {
    safeError(
      "views",
      error
    );
  }
}

async function openComments(
  postId
) {
  state.currentPostId =
    postId;

  const list =
    $("commentsList");

  if (!list) {
    return;
  }

  list.innerHTML = `
    <div class="comments-empty">
      Loading comments...
    </div>
  `;

  openModal(
    "commentsModal"
  );

  const {
    data,
    error
  } =
    await supabaseClient
      .from("comments")
      .select(`
        id,
        created_at,
        post_id,
        user_id,
        content,
        users:user_id(
          id,
          username,
          display_name,
          avatar,
          verified,
          plan
        )
      `)
      .eq(
        "post_id",
        postId
      )
      .order(
        "created_at",
        {
          ascending: true
        }
      );

  if (error) {
    safeError(
      "comments-load",
      error
    );

    list.innerHTML = `
      <div class="comments-empty">
        Unable to load comments.
      </div>
    `;

    return;
  }

  state.comments.set(
    String(
      postId
    ),
    data || []
  );

  renderComments(
    postId
  );
}

function renderComments(
  postId
) {
  const list =
    $("commentsList");

  if (!list) {
    return;
  }

  const comments =
    state.comments.get(
      String(
        postId
      )
    ) || [];

  if (!comments.length) {
    list.innerHTML = `
      <div class="comments-empty">
        No comments yet.
      </div>
    `;

    return;
  }

  list.innerHTML =
    comments
      .map(
        (comment) => {
          const user =
            normalizeUser(
              comment.users ||
                {}
            );

          return `
            <article class="comment-item">

              ${avatarMarkup(
                user,
                "avatar small"
              )}

              <div class="comment-content">

                <div class="comment-meta">

                  <strong>
                    ${escapeHtml(
                      user.display_name
                    )}
                  </strong>

                  <span>
                    @${escapeHtml(
                      user.username
                    )}
                  </span>

                  <span>
                    ${escapeHtml(
                      timeAgo(
                        comment.created_at
                      )
                    )}
                  </span>

                </div>

                <p>
                  ${escapeHtml(
                    comment.content
                  )}
                </p>

              </div>

            </article>
          `;
        }
      )
      .join("");
}

async function sendComment() {
  const input =
    $("commentInput");

  const content =
    input?.value.trim() ||
    "";

  if (
    !content ||
    !state.currentPostId ||
    !state.user?.id
  ) {
    return;
  }

  try {
    const {
      error
    } =
      await supabaseClient
        .from("comments")
        .insert({
          post_id:
            state.currentPostId,

          user_id:
            state.user.id,

          content
        });

    if (error) {
      throw error;
    }

    input.value = "";

    await openComments(
      state.currentPostId
    );

    await loadPosts();

    renderPosts();

  } catch (error) {
    safeError(
      "comment-send",
      error
    );

    showToast(
      error.message ||
        "Unable to send comment."
    );
  }
}

function openStoryGroup(
  userId
) {
  const group =
    state.stories.filter(
      (story) =>
        String(
          story.user_id
        ) ===
        String(
          userId
        )
    );

  if (!group.length) {
    if (
      String(
        userId
      ) ===
      String(
        state.user?.id
      )
    ) {
      openStoryEditor();
    }

    return;
  }

  state.currentStoryGroup =
    group;

  state.currentStoryIndex =
    0;

  renderStoryViewer();

  openModal(
    "storyViewer"
  );

  recordStoryView(
    group[0]
  );
}

function renderStoryViewer() {
  const story =
    state.currentStoryGroup[
      state.currentStoryIndex
    ];

  if (!story) {
    return;
  }

  const media =
    $("storyViewerMedia");

  const text =
    $("storyViewerText");

  const user =
    $("storyViewerUser");

  if (media) {
    media.innerHTML =
      "";

    if (
      story.media_type ===
      "video"
    ) {
      const video =
        document.createElement(
          "video"
        );

      video.src =
        story.image;

      video.autoplay =
        true;

      video.muted =
        true;

      video.loop =
        false;

      video.controls =
        false;

      video.playsInline =
        true;

      video.className =
        "story-viewer-video";

      media.appendChild(
        video
      );

      video.play().catch(
        () => {}
      );

    } else if (
      story.image
    ) {
      const image =
        document.createElement(
          "img"
        );

      image.src =
        story.image;

      image.alt =
        "";

      media.appendChild(
        image
      );
    }
  }

  if (text) {
    text.textContent =
      story.story_text ||
      "";

    text.style.color =
      story.text_color ||
      "#ffffff";

    text.style.top =
      story.text_position ===
      "top"
        ? "20%"
        : story.text_position ===
            "bottom"
          ? "75%"
          : "45%";
  }

  if (user) {
    user.innerHTML = `
      ${avatarMarkup(
        story.user,
        "viewer-avatar"
      )}

      <div>

        <strong>
          ${escapeHtml(
            story.user
              .display_name
          )}
        </strong>

        <span>
          @${escapeHtml(
            story.user.username
          )}
        </span>

      </div>
    `;
  }

  refreshIcons();
}

async function recordStoryView(
  story
) {
  if (
    !story?.id ||
    !state.user?.id ||
    String(
      story.user_id
    ) ===
      String(
        state.user.id
      )
  ) {
    return;
  }

  const existing =
    await supabaseClient
      .from("story_views")
      .select("id")
      .eq(
        "story_id",
        story.id
      )
      .eq(
        "viewer_id",
        state.user.id
      )
      .maybeSingle();

  if (
    existing.error ||
    existing.data
  ) {
    return;
  }

  const {
    error
  } =
    await supabaseClient
      .from("story_views")
      .insert({
        story_id:
          story.id,

        viewer_id:
          state.user.id
      });

  if (error) {
    return;
  }

  story.viewers_count +=
    1;

  await supabaseClient
    .from("stories")
    .update({
      viewers_count:
        story.viewers_count
    })
    .eq(
      "id",
      story.id
    );
}

function nextStory() {
  if (
    state.currentStoryIndex >=
    state.currentStoryGroup
      .length -
      1
  ) {
    closeModal(
      "storyViewer"
    );

    return;
  }

  state.currentStoryIndex +=
    1;

  const story =
    state.currentStoryGroup[
      state.currentStoryIndex
    ];

  renderStoryViewer();

  recordStoryView(
    story
  );
}

function getWheelStorage() {
  const raw =
    localStorage.getItem(
      ARS_WHEEL_STORAGE_KEY
    );

  if (!raw) {
    return {
      week: getWheelWeekKey(),
      spins: 0
    };
  }

  try {
    const data =
      JSON.parse(raw);

    if (
      data.week !==
      getWheelWeekKey()
    ) {
      return {
        week:
          getWheelWeekKey(),
        spins: 0
      };
    }

    return {
      week:
        data.week,
      spins:
        Number(
          data.spins || 0
        )
    };
  } catch (_) {
    return {
      week:
        getWheelWeekKey(),
      spins: 0
    };
  }
}

function getWheelWeekKey() {
  const date =
    new Date();

  const first =
    new Date(
      date.getFullYear(),
      0,
      1
    );

  const days =
    Math.floor(
      (
        date -
        first
      ) /
        86400000
    );

  const week =
    Math.ceil(
      (
        days +
        first.getDay() +
        1
      ) / 7
    );

  return `${date.getFullYear()}-${week}`;
}

function saveWheelStorage(
  spins
) {
  localStorage.setItem(
    ARS_WHEEL_STORAGE_KEY,
    JSON.stringify({
      week:
        getWheelWeekKey(),
      spins
    })
  );

  state.wheelSpins =
    spins;
}

function wheelRemainingSpins() {
  if (
    state.user?.plan ===
    "premium"
  ) {
    return Infinity;
  }

  return Math.max(
    0,
    ARS_WHEEL_FREE_SPINS -
      state.wheelSpins
  );
}

function ensureWheelControls() {
  const page =
    $("wheelPage");

  if (!page) {
    return;
  }

  let backButton =
    $("wheelBackButton");

  if (!backButton) {
    backButton =
      document.createElement(
        "button"
      );

    backButton.id =
      "wheelBackButton";

    backButton.type =
      "button";

    backButton.className =
      "secondary-button small";

    backButton.innerHTML = `
      <i data-lucide="arrow-left"></i>
      Back
    `;

    const card =
      page.querySelector(
        ".wheel-card"
      );

    if (card) {
      card.prepend(
        backButton
      );
    }
  }

  let subscribe =
    $("wheelSubscribeButton");

  if (!subscribe) {
    subscribe =
      document.createElement(
        "button"
      );

    subscribe.id =
      "wheelSubscribeButton";

    subscribe.type =
      "button";

    subscribe.className =
      "primary-button";

    subscribe.textContent =
      "Subscribe to continue";

    subscribe.style.display =
      "none";

    const card =
      page.querySelector(
        ".wheel-card"
      );

    if (card) {
      card.appendChild(
        subscribe
      );
    }
  }

  refreshIcons();
}

function renderWheelSegments() {
  const wheel =
    $("wheel");

  if (!wheel) {
    return;
  }

  wheel.innerHTML = `
    <div class="ars-wheel-center">
      <i data-lucide="sparkles"></i>
    </div>

    ${WHEEL_CHALLENGES.map(
      (
        challenge,
        index
      ) => `
        <div
          class="ars-wheel-segment"
          data-segment="${index}"
        >
          <span>
            ${escapeHtml(
              challenge.category
            )}
          </span>
        </div>
      `
    ).join("")}
  `;

  wheel.dataset.segments =
    String(
      WHEEL_CHALLENGES.length
    );

  refreshIcons();
}

function renderWheel() {
  ensureWheelControls();
  renderWheelSegments();

  const storage =
    getWheelStorage();

  state.wheelSpins =
    storage.spins;

  const remaining =
    wheelRemainingSpins();

  const counter =
    $("spinCounter");

  if (counter) {
    counter.textContent =
      remaining ===
      Infinity
        ? "Unlimited spins"
        : `${remaining} free spin${
            remaining === 1
              ? ""
              : "s"
          } remaining`;
  }

  const plan =
    $("planLabel");

  if (plan) {
    plan.textContent =
      state.user?.plan ===
      "premium"
        ? "Premium"
        : "Free";
  }

  const result =
    $("challengeResult");

  if (
    remaining === 0
  ) {
    if (result) {
      result.textContent =
        "Your free spins are finished.";
    }
  }

  const spin =
    $("spinButton");

  if (spin) {
    spin.disabled =
      remaining === 0 &&
      state.user?.plan !==
        "premium";
  }

  const subscribe =
    $("wheelSubscribeButton");

  if (subscribe) {
    subscribe.style.display =
      remaining === 0 &&
      state.user?.plan !==
        "premium"
        ? "block"
        : "none";
  }

  refreshIcons();
}

async function spinWheel() {
  const wheel =
    $("wheel");

  if (!wheel) {
    return;
  }

  const remaining =
    wheelRemainingSpins();

  if (
    remaining === 0 &&
    state.user?.plan !==
      "premium"
  ) {
    renderWheel();

    showToast(
      "Your 2 free spins are finished."
    );

    return;
  }

  const index =
    Math.floor(
      Math.random() *
        WHEEL_CHALLENGES.length
    );

  const challenge =
    WHEEL_CHALLENGES[
      index
    ];

  const segmentAngle =
    360 /
    WHEEL_CHALLENGES.length;

  const targetAngle =
    360 -
    index *
      segmentAngle -
    segmentAngle /
      2;

  state.wheelRotation +=
    360 * 5 +
    targetAngle;

  wheel.style.transform =
    `rotate(${state.wheelRotation}deg)`;

  if (
    state.user?.plan !==
    "premium"
  ) {
    saveWheelStorage(
      state.wheelSpins +
        1
    );
  }

  const spinButton =
    $("spinButton");

  if (spinButton) {
    spinButton.disabled =
      true;
  }

  setTimeout(
    () => {
      const result =
        $("challengeResult");

      if (result) {
        result.innerHTML = `
          <strong>
            ${escapeHtml(
              challenge.title
            )}
          </strong>
          <br>
          <span>
            +${challenge.reward} XP
          </span>
        `;
      }

      renderWheel();

      const nextRemaining =
        wheelRemainingSpins();

      if (
        nextRemaining ===
        0
      ) {
        showToast(
          "Free spins finished. Subscribe for more."
        );
      }

    },
    1300
  );
}

function renderStreak() {
  const value =
    Number(
      state.user?.streak ||
        0
    );

  if ($("streakNumber")) {
    $("streakNumber")
      .textContent =
      value;
  }

  if ($("streakText")) {
    $("streakText")
      .textContent =
      "day streak";
  }

  if ($("weekDots")) {
    $("weekDots").innerHTML =
      Array.from(
        {
          length: 7
        },
        (_, index) =>
          `
            <span>
              ${
                index <
                Math.min(
                  value,
                  7
                )
                  ? "✓"
                  : ""
              }
            </span>
          `
      ).join("");
  }

  if ($("streakDone")) {
    $("streakDone")
      .textContent =
      value
        ? "Keep your ARS streak going."
        : "Start your streak by staying active.";
  }

  refreshIcons();
}

function openProfileFromUser(
  userId
) {
  if (
    !userId ||
    !state.user
  ) {
    return;
  }

  if (
    String(userId) ===
    String(
      state.user.id
    )
  ) {
    showPage(
      "profilePage"
    );

    return;
  }

  const posts =
    state.posts.filter(
      (post) =>
        String(
          post.user_id
        ) ===
        String(
          userId
        )
    );

  const user =
    posts[0]?.user;

  if (!user) {
    showToast(
      "Profile is not available yet."
    );

    return;
  }

  const target =
    $("profileHero");

  if (target) {
    target.innerHTML = `
      <div class="profile-card">

        ${avatarMarkup(
          user,
          "profile-avatar"
        )}

        <div>

          <h1>
            ${escapeHtml(
              user.display_name
            )}
          </h1>

          <p>
            @${escapeHtml(
              user.username
            )}
          </p>

          ${
            user.bio
              ? `
                <span>
                  ${escapeHtml(
                    user.bio
                  )}
                </span>
              `
              : ""
          }

        </div>

      </div>
    `;
  }

  renderPosts(
    posts,
    $("profilePostsList")
  );

  showPage(
    "profilePage"
  );
}

function handleDocumentClick(
  event
) {
  const story =
    event.target.closest?.(
      "[data-story-user]"
    );

  if (story) {
    event.preventDefault();

    openStoryGroup(
      story.dataset
        .storyUser
    );

    return;
  }

  const profile =
    event.target.closest?.(
      "[data-profile-user]"
    );

  if (profile) {
    event.preventDefault();

    openProfileFromUser(
      profile.dataset
        .profileUser
    );

    return;
  }

  const action =
    event.target.closest?.(
      "[data-action]"
    );

  if (action) {
    event.preventDefault();

    togglePostAction(
      action.dataset.action,
      action.dataset.id
    );

    return;
  }

  const hashtag =
    event.target.closest?.(
      "[data-hashtag]"
    );

  if (hashtag) {
    event.preventDefault();

    const value =
      `#${hashtag.dataset.hashtag}`;

    state.searchQuery =
      value;

    showPage(
      "searchPage"
    );

    if ($("searchInput")) {
      $("searchInput").value =
        value;
    }

    performSearch(
      value
    );

    return;
  }

  const trend =
    event.target.closest?.(
      "[data-trending-tag]"
    );

  if (trend) {
    const value =
      `#${trend.dataset.trendingTag}`;

    state.searchQuery =
      value;

    showPage(
      "searchPage"
    );

    if ($("searchInput")) {
      $("searchInput").value =
        value;
    }

    performSearch(
      value
    );

    return;
  }

  const searchUser =
    event.target.closest?.(
      "[data-search-user]"
    );

  if (searchUser) {
    openProfileFromUser(
      searchUser.dataset
        .searchUser
    );

    return;
  }

  const searchPost =
    event.target.closest?.(
      "[data-search-post]"
    );

  if (searchPost) {
    const post =
      state.posts.find(
        (item) =>
          String(
            item.id
          ) ===
          String(
            searchPost.dataset
              .searchPost
          )
      );

    if (post) {
      showPage(
        "homePage"
      );

      requestAnimationFrame(
        () => {
          document
            .querySelector(
              `[data-post-id="${CSS.escape(
                String(
                  post.id
                )
              )}"]`
            )
            ?.scrollIntoView({
              behavior:
                "smooth",
              block:
                "center"
            });
        }
      );
    }

    return;
  }

  const searchTag =
    event.target.closest?.(
      "[data-search-tag]"
    );

  if (searchTag) {
    const value =
      `#${searchTag.datas
