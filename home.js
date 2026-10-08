const SUPABASE_URL =
  "https://bfqsqgfyyewnfxekirfv.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_OM-LGm9LZCtmzkGYmpyA8A_jnvgmH1-";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

const ARS_WHEEL_FREE_SPINS = 2;
const ARS_WHEEL_STORAGE_KEY =
  "ars_wheel_spins";

const $ = id =>
  document.getElementById(id);

const state = {
  initialized: false,
  user: null,
  posts: [],
  stories: [],
  comments: new Map(),

  currentPostId: null,

  currentStoryGroup: [],
  currentStoryIndex: 0,

  storyFile: null,
  storyMediaData: null,
  storyMediaType: "image",
  storyZoom: 1,
  storyFilter: "none",
  storySticker: null,

  postImageData: null,

  wheelSpins: ARS_WHEEL_FREE_SPINS,
  wheelRotation: 0,

  searchQuery: ""
};

const WHEEL_CHALLENGES = [
  {
    title: "Post something today",
    category: "POST",
    reward: 20
  },
  {
    title: "Share a story",
    category: "STORY",
    reward: 25
  },
  {
    title: "Like three posts",
    category: "LIKE",
    reward: 15
  },
  {
    title: "Use a hashtag",
    category: "TAG",
    reward: 10
  },
  {
    title: "Leave a comment",
    category: "COMMENT",
    reward: 15
  },
  {
    title: "Keep your streak alive",
    category: "STREAK",
    reward: 30
  }
];

function safeError(context, error) {
  try {
    if (
      window.ARSErrors &&
      typeof window.ARSErrors.capture ===
        "function"
    ) {
      window.ARSErrors.capture(
        context,
        error
      );
      return;
    }
  } catch (_) {}

  console.error(
    `[ARS:${context}]`,
    error
  );
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatCount(value) {
  const number =
    Number(value || 0);

  if (number >= 1000000) {
    return (
      number / 1000000
    ).toFixed(1) + "M";
  }

  if (number >= 1000) {
    return (
      number / 1000
    ).toFixed(1) + "K";
  }

  return String(number);
}

function timeAgo(date) {
  const timestamp =
    new Date(date).getTime();

  if (!Number.isFinite(timestamp)) {
    return "";
  }

  const seconds =
    Math.max(
      0,
      Math.floor(
        (Date.now() - timestamp) /
          1000
      )
    );

  if (seconds < 60) {
    return "now";
  }

  const minutes =
    Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours =
    Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h`;
  }

  const days =
    Math.floor(hours / 24);

  if (days < 7) {
    return `${days}d`;
  }

  return new Date(
    timestamp
  ).toLocaleDateString();
}

function refreshIcons() {
  try {
    if (
      window.lucide &&
      typeof window.lucide.createIcons ===
        "function"
    ) {
      window.lucide.createIcons();
    }
  } catch (error) {
    safeError(
      "icons",
      error
    );
  }
}

function showToast(message) {
  const toast = $("toast");

  if (!toast) {
    return;
  }

  toast.textContent =
    String(message || "");

  toast.classList.add("show");

  clearTimeout(
    showToast.timer
  );

  showToast.timer =
    setTimeout(() => {
      toast.classList.remove(
        "show"
      );
    }, 2800);
}

function normalizeUser(user) {
  const value =
    user || {};

  return {
    id: value.id || "",
    username:
      value.username ||
      "user",
    display_name:
      value.display_name ||
      value.username ||
      "User",
    email:
      value.email || "",
    bio:
      value.bio || "",
    avatar:
      value.avatar || "",
    verified:
      Boolean(value.verified),
    plan:
      value.plan || "free",
    streak:
      Number(value.streak || 0),
    xp:
      Number(value.xp || 0)
  };
}

function avatarMarkup(
  user,
  className = "avatar"
) {
  const value =
    normalizeUser(user);

  if (value.avatar) {
    return `
      <span class="${escapeHtml(
        className
      )}">
        <img
          src="${escapeHtml(
            value.avatar
          )}"
          alt=""
        >
      </span>
    `;
  }

  const letter =
    (
      value.display_name ||
      value.username ||
      "A"
    )
      .trim()
      .charAt(0)
      .toUpperCase() ||
    "A";

  return `
    <span class="${escapeHtml(
      className
    )}">
      ${escapeHtml(letter)}
    </span>
  `;
}

function normalizePost(row) {
  const value =
    row || {};

  return {
    id: value.id,
    created_at:
      value.created_at,
    user_id:
      value.user_id,
    user:
      normalizeUser(
        value.users ||
        value.user ||
        {}
      ),
    content:
      value.content || "",
    image:
      value.image || "",
    likes_count:
      Number(
        value.likes_count || 0
      ),
    comments_count:
      Number(
        value.comments_count || 0
      ),
    reposts_count:
      Number(
        value.reposts_count || 0
      ),
    views_count:
      Number(
        value.views_count || 0
      ),
    liked:
      Boolean(value.liked),
    reposted:
      Boolean(value.reposted),
    bookmarked:
      Boolean(value.bookmarked)
  };
}

function normalizeStory(row) {
  const value =
    row || {};

  const media =
    value.image || "";

  let mediaType =
    value.media_type ||
    "image";

  if (
    !value.media_type &&
    media.startsWith(
      "data:video/"
    )
  ) {
    mediaType = "video";
  }

  return {
    id: value.id,
    created_at:
      value.created_at,
    user_id:
      value.user_id,
    user:
      normalizeUser(
        value.users ||
        value.user ||
        {}
      ),
    image: media,
    viewers_count:
      Number(
        value.viewers_count || 0
      ),
    expires_at:
      value.expires_at,
    media_type:
      mediaType,
    story_text:
      value.story_text || "",
    text_position:
      value.text_position ||
      "center",
    text_color:
      value.text_color ||
      "#ffffff",
    filter:
      value.filter || "none",
    sticker:
      value.sticker || null,
    zoom:
      Number(value.zoom || 1)
  };
}

function isStoryActive(story) {
  if (!story?.expires_at) {
    return true;
  }

  const timestamp =
    new Date(
      story.expires_at
    ).getTime();

  if (!Number.isFinite(timestamp)) {
    return true;
  }

  return timestamp > Date.now();
}

function hashtagsFromText(text) {
  const matches =
    String(text || "").match(
      /#[\p{L}\p{N}_]+/gu
    ) || [];

  return [
    ...new Set(
      matches.map(tag =>
        tag
          .slice(1)
          .toLowerCase()
      )
    )
  ];
}

function renderRichText(text) {
  const escaped =
    escapeHtml(text);

  return escaped.replace(
    /(^|\s)#([\p{L}\p{N}_]+)/gu,
    '$1<span class="hashtag" data-hashtag="$2">#$2</span>'
  );
}

async function loadCurrentUser() {
  const {
    data,
    error
  } =
    await supabaseClient.auth.getUser();

  if (error) {
    throw error;
  }

  const authUser =
    data?.user;

  if (!authUser) {
    return null;
  }

  const {
    data: profile,
    error: profileError
  } =
    await supabaseClient
      .from("users")
      .select("*")
      .eq(
        "id",
        authUser.id
      )
      .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  return normalizeUser(
    profile || {
      id: authUser.id,
      email:
        authUser.email || ""
    }
  );
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
          email,
          bio,
          avatar,
          verified,
          plan,
          streak,
          xp
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

  await loadPostActions();
}

async function loadPostActions() {
  if (!state.user?.id) {
    return;
  }

  const ids =
    state.posts
      .map(post => post.id)
      .filter(Boolean);

  if (!ids.length) {
    return;
  }

  const [
    likes,
    reposts,
    bookmarks
  ] =
    await Promise.all([
      supabaseClient
        .from("likes")
        .select("post_id")
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
        .select("post_id")
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
        .select("post_id")
        .eq(
          "user_id",
          state.user.id
        )
        .in(
          "post_id",
          ids
        )
    ]);

  const liked =
    new Set(
      (likes.data || []).map(
        item =>
          String(
            item.post_id
          )
      )
    );

  const reposted =
    new Set(
      (reposts.data || []).map(
        item =>
          String(
            item.post_id
          )
      )
    );

  const bookmarked =
    new Set(
      (bookmarks.data || []).map(
        item =>
          String(
            item.post_id
          )
      )
    );

  state.posts.forEach(
    post => {
      post.liked =
        liked.has(
          String(post.id)
        );

      post.reposted =
        reposted.has(
          String(post.id)
        );

      post.bookmarked =
        bookmarked.has(
          String(post.id)
        );
    }
  );

  if (likes.error) {
    safeError(
      "likes",
      likes.error
    );
  }

  if (reposts.error) {
    safeError(
      "reposts",
      reposts.error
    );
  }

  if (bookmarks.error) {
    safeError(
      "bookmarks",
      bookmarks.error
    );
  }
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
          email,
          bio,
          avatar,
          verified,
          plan,
          streak,
          xp
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

  state.stories =
    (data || [])
      .map(normalizeStory)
      .filter(
        isStoryActive
      );
}

async function loadAll() {
  try {
    state.user =
      await loadCurrentUser();

    if (!state.user) {
      showToast(
        "Please log in first."
      );
      return;
    }

    await Promise.all([
      loadPosts(),
      loadStories()
    ]);

    renderAll();
    updateUserUI();

    state.initialized = true;
  } catch (error) {
    safeError(
      "load-all",
      error
    );

    showToast(
      error.message ||
      "Unable to load ARS."
    );
  }
}

function renderAll() {
  renderStories();
  renderPosts();
  renderTrending();
  renderStreak();
  renderProfile();
  renderWheel();

  if (state.searchQuery) {
    performSearch(
      state.searchQuery
    );
  }

  refreshIcons();
}

function updateUserUI() {
  const profile =
    $("profileButton");

  if (profile) {
    profile.innerHTML =
      avatarMarkup(
        state.user,
        "avatar top-avatar"
      );
  }

  const compose =
    $("composeAvatar");

  if (compose) {
    compose.innerHTML =
      avatarMarkup(
        state.user,
        "avatar"
      );
  }

  renderStreak();
  refreshIcons();
}

function renderStories() {
  const container =
    $("stories");

  if (!container) {
    return;
  }

  const active =
    state.stories.filter(
      isStoryActive
    );

  const groups =
    new Map();

  active.forEach(
    story => {
      const key =
        String(
          story.user_id || ""
        );

      if (!key) {
        return;
      }

      if (!groups.has(key)) {
        groups.set(
          key,
          []
        );
      }

      groups
        .get(key)
        .push(story);
    }
  );

  if (state.user?.id) {
    const own =
      String(state.user.id);

    if (!groups.has(own)) {
      groups.set(
        own,
        []
      );
    }
  }

  const entries =
    [...groups.entries()];

  entries.sort(
    ([a], [b]) => {
      const own =
        String(
          state.user?.id || ""
        );

      if (a === own) {
        return -1;
      }

      if (b === own) {
        return 1;
      }

      return 0;
    }
  );

  container.innerHTML =
    entries
      .map(
        ([userId, stories]) => {
          const user =
            stories[0]?.user ||
            (
              String(
                state.user?.id
              ) ===
              String(userId)
                ? state.user
                : {}
            );

          const own =
            String(userId) ===
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
              <span class="story-ring">
                ${avatarMarkup(
                  user,
                  "avatar story-avatar"
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
                    : (
                        user.display_name ||
                        user.username ||
                        "User"
                      )
                )}
              </span>
            </button>
          `;
        }
      )
      .join("");

  refreshIcons();
}

function postMarkup(post) {
  const owner =
    String(post.user_id) ===
    String(state.user?.id);

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
            "avatar post-avatar"
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
          aria-label="Post menu"
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
            <div class="post-media">
              <img
                class="post-image"
                src="${escapeHtml(
                  post.image
                )}"
                alt=""
                loading="lazy"
                onerror="this.parentElement.classList.add('media-error')"
              >
            </div>
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
          aria-label="Like"
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
          aria-label="Comments"
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
          aria-label="Repost"
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
          aria-label="Bookmark"
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
          aria-label="Views"
        >
          <i data-lucide="eye"></i>
          <span>
            ${formatCount(
              post.views_count
            )}
          </span>
        </button>

      </div>

      ${
        owner
          ? `
            <span
              class="post-owner-marker"
              hidden
            ></span>
          `
          : ""
      }
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
          Create a post and it will
          appear here.
        </p>
      </div>
    `;
  } else {
    target.innerHTML =
      list
        .map(postMarkup)
        .join("");
  }

  refreshIcons();
}

function buildHashtagCounts() {
  const counts =
    new Map();

  state.posts.forEach(
    post => {
      hashtagsFromText(
        post.content
      ).forEach(
        tag => {
          counts.set(
            tag,
            (
              counts.get(tag) ||
              0
            ) + 1
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

  const live =
    [...counts.entries()]
      .sort(
        (a, b) =>
          b[1] - a[1]
      )
      .slice(0, 20);

  const suggestions = [
    ["focus", "Focus"],
    ["life", "Life"],
    [
      "technology",
      "Technology"
    ],
    ["travel", "Travel"],
    ["fitness", "Fitness"],
    ["music", "Music"]
  ];

  const liveHtml =
    live.map(
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
    ).join("");

  const suggestionHtml =
    suggestions.map(
      ([tag, label]) => `
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
              ${escapeHtml(
                label
              )} · Discover topic
            </span>
          </div>

          <i data-lucide="chevron-right"></i>
        </button>
      `
    ).join("");

  target.innerHTML =
    liveHtml +
    (
      live.length
        ? `
          <div class="trend-preview">
            <span>
              Discover more
            </span>
            <p>
              Explore conversations
              through hashtags.
            </p>
          </div>
        `
        : ""
    ) +
    suggestionHtml;

  refreshIcons();
}

function renderStreak() {
  const value =
    Number(
      state.user?.streak || 0
    );

  const number =
    $("streakNumber");

  if (number) {
    number.textContent =
      String(value);
  }

  const text =
    $("streakText");

  if (text) {
    text.textContent =
      "day streak";
  }

  const dots =
    $("weekDots");

  if (dots) {
    dots.innerHTML =
      Array.from(
        {
          length: 7
        },
        (_, index) => `
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

  const done =
    $("streakDone");

  if (done) {
    done.textContent =
      value > 0
        ? "Keep your ARS streak going."
        : "Start your streak by staying active.";
  }

  refreshIcons();
}

function renderProfile(
  user = state.user,
  posts = state.posts.filter(
    post =>
      String(
        post.user_id
      ) ===
      String(
        user?.id
      )
  )
) {
  const target =
    $("profileHero");

  if (!target || !user) {
    return;
  }

  target.innerHTML = `
    <div class="profile-card">
      ${avatarMarkup(
        user,
        "avatar profile-avatar"
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

  renderPosts(
    posts,
    $("profilePostsList")
  );
        }
async function openProfileFromUser(
  userId
) {
  if (!userId) {
    return;
  }

  if (
    String(userId) ===
    String(state.user?.id)
  ) {
    renderProfile();
    showPage(
      "profilePage"
    );
    return;
  }

  try {
    const {
      data: user,
      error: userError
    } =
      await supabaseClient
        .from("users")
        .select("*")
        .eq(
          "id",
          userId
        )
        .maybeSingle();

    if (userError) {
      throw userError;
    }

    if (!user) {
      showToast(
        "Profile is not available."
      );
      return;
    }

    const {
      data: posts,
      error: postsError
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
            plan,
            streak,
            xp
          )
        `)
        .eq(
          "user_id",
          userId
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        );

    if (postsError) {
      throw postsError;
    }

    renderProfile(
      normalizeUser(user),
      (posts || []).map(
        normalizePost
      )
    );

    showPage(
      "profilePage"
    );
  } catch (error) {
    safeError(
      "profile",
      error
    );

    showToast(
      error.message ||
      "Unable to open profile."
    );
  }
}

function showPage(pageId) {
  document
    .querySelectorAll(
      ".page"
    )
    .forEach(page => {
      page.classList.toggle(
        "active",
        page.id === pageId
      );
    });

  document
    .querySelectorAll(
      ".nav-item[data-page]"
    )
    .forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.page ===
          pageId
      );
    });

  if (
    pageId ===
    "profilePage"
  ) {
    renderProfile();
  }

  if (
    pageId ===
    "trendingPage"
  ) {
    renderTrending();
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
    setTimeout(() => {
      $("searchInput")?.focus();
    }, 50);
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  refreshIcons();
}

function openModal(id) {
  const modal = $(id);

  if (!modal) {
    return;
  }

  modal.classList.add(
    "open"
  );

  refreshIcons();
}

function closeModal(id) {
  const modal = $(id);

  if (!modal) {
    return;
  }

  modal.classList.remove(
    "open"
  );
}

function resetPostComposer() {
  state.postImageData =
    null;

  const text =
    $("createPostText");

  if (text) {
    text.value = "";
  }

  const input =
    $("createPostImage");

  if (input) {
    input.value = "";
  }

  const preview =
    $("postImagePreview");

  if (preview) {
    preview.innerHTML = "";
  }
}

function openPostComposer() {
  resetPostComposer();

  const avatar =
    $("composeAvatar");

  if (avatar) {
    avatar.innerHTML =
      avatarMarkup(
        state.user,
        "avatar"
      );
  }

  openModal(
    "createPostModal"
  );
}

function resetStoryEditor() {
  state.storyFile =
    null;

  state.storyMediaData =
    null;

  state.storyMediaType =
    "image";

  state.storyZoom =
    1;

  state.storyFilter =
    "none";

  state.storySticker =
    null;

  const input =
    $("storyImage");

  if (input) {
    input.value = "";
  }

  const canvas =
    $("storyCanvas");

  if (canvas) {
    canvas
      .querySelectorAll(
        ".ars-story-editor-media"
      )
      .forEach(
        element =>
          element.remove()
      );
  }

  const empty =
    $("storyCanvasEmpty");

  if (empty) {
    empty.style.display =
      "flex";
  }

  const oldPreview =
    $("storyImagePreview");

  if (oldPreview) {
    oldPreview.style.display =
      "none";

    oldPreview.removeAttribute(
      "src"
    );
  }

  const text =
    $("storyText");

  if (text) {
    text.value = "";
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

async function handlePostFile(
  file
) {
  if (!file) {
    return;
  }

  if (
    !file.type.startsWith(
      "image/"
    )
  ) {
    showToast(
      "Choose an image."
    );
    return;
  }

  try {
    state.postImageData =
      await readFileAsDataUrl(
        file
      );

    const preview =
      $("postImagePreview");

    if (preview) {
      preview.innerHTML = `
        <img
          src="${escapeHtml(
            state.postImageData
          )}"
          alt=""
        >
      `;
    }
  } catch (error) {
    safeError(
      "post-file",
      error
    );

    showToast(
      "Unable to read this image."
    );
  }
}

async function handleStoryFile(
  file
) {
  if (!file) {
    return;
  }

  const image =
    file.type.startsWith(
      "image/"
    );

  const video =
    file.type.startsWith(
      "video/"
    );

  if (!image && !video) {
    showToast(
      "Choose an image or video."
    );
    return;
  }

  try {
    state.storyFile =
      file;

    state.storyMediaType =
      video
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

  if (!canvas) {
    return;
  }

  let media =
    canvas.querySelector(
      ".ars-story-editor-media"
    );

  if (state.storyMediaData) {
    const wanted =
      state.storyMediaType ===
      "video"
        ? "VIDEO"
        : "IMG";

    if (
      !media ||
      media.tagName !== wanted
    ) {
      media?.remove();

      media =
        document.createElement(
          wanted === "VIDEO"
            ? "video"
            : "img"
        );

      media.className =
        "ars-story-editor-media";

      if (
        wanted === "VIDEO"
      ) {
        media.muted = true;
        media.loop = true;
        media.autoplay = true;
        media.playsInline =
          true;
      }

      canvas.prepend(media);
    }

    media.src =
      state.storyMediaData;

    media.style.display =
      "block";

    media.style.transform =
      `scale(${state.storyZoom})`;

    media.style.filter =
      state.storyFilter ===
      "bw"
        ? "grayscale(1)"
        : state.storyFilter ===
          "warm"
          ? "sepia(.35) saturate(1.25)"
          : "none";

    const empty =
      $("storyCanvasEmpty");

    if (empty) {
      empty.style.display =
        "none";
    }

    if (
      media.tagName ===
      "VIDEO"
    ) {
      media.play().catch(
        () => {}
      );
    }
  } else {
    media?.remove();

    const empty =
      $("storyCanvasEmpty");

    if (empty) {
      empty.style.display =
        "flex";
    }
  }

  const textPreview =
    $("storyTextPreview");

  if (textPreview) {
    const text =
      $("storyText")
        ?.value || "";

    const position =
      $("storyPosition")
        ?.value ||
      "center";

    textPreview.textContent =
      text;

    textPreview.style.color =
      $("storyTextColor")
        ?.value ||
      "#ffffff";

    textPreview.style.top =
      position === "top"
        ? "20%"
        : position === "bottom"
          ? "75%"
          : "45%";
  }

  refreshIcons();
}

async function publishPost() {
  const content =
    $("createPostText")
      ?.value.trim() || "";

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
            plan,
            streak,
            xp
          )
        `)
        .single();

    if (error) {
      throw error;
    }

    if (data) {
      state.posts.unshift(
        normalizePost(data)
      );
    }

    closeModal(
      "createPostModal"
    );

    resetPostComposer();

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
      ?.value.trim() || "";

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
    const {
      data,
      error
    } =
      await supabaseClient
        .from("stories")
        .insert({
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
            $("storyPosition")
              ?.value ||
            "center",
          text_color:
            $("storyTextColor")
              ?.value ||
            "#ffffff",
          filter:
            state.storyFilter,
          sticker:
            state.storySticker,
          zoom:
            state.storyZoom,
          expires_at:
            new Date(
              Date.now() +
              86400000
            ).toISOString()
        })
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
            plan,
            streak,
            xp
          )
        `)
        .single();

    if (error) {
      throw error;
    }

    if (data) {
      state.stories.unshift(
        normalizeStory(data)
      );
    }

    closeModal(
      "createStoryModal"
    );

    resetStoryEditor();

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
      item =>
        String(item.id) ===
        String(postId)
    );

  if (
    !post ||
    !state.user?.id
  ) {
    return;
  }

  if (
    action === "comment"
  ) {
    await openComments(
      postId
    );
    return;
  }

  if (
    action === "view"
  ) {
    await incrementViews(
      post
    );
    return;
  }

  const table =
    action === "like"
      ? "likes"
      : action === "repost"
        ? "reposts"
        : action ===
          "bookmark"
          ? "bookmarks"
          : null;

  if (!table) {
    return;
  }

  try {
    const {
      data: existing,
      error: selectError
    } =
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

    if (selectError) {
      throw selectError;
    }

    if (existing) {
      const {
        error
      } =
        await supabaseClient
          .from(table)
          .delete()
          .eq(
            "id",
            existing.id
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
  if (!post?.id) {
    return;
  }

  const next =
    Number(
      post.views_count || 0
    ) + 1;

  post.views_count =
    next;

  renderPosts();

  try {
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
      throw error;
    }
  } catch (error) {
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

  try {
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
            plan,
            streak,
            xp
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
      throw error;
    }

    state.comments.set(
      String(postId),
      data || []
    );

    renderComments(
      postId
    );
  } catch (error) {
    safeError(
      "comments",
      error
    );

    list.innerHTML = `
      <div class="comments-empty">
        Unable to load comments.
      </div>
    `;
  }
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
      String(postId)
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
      .map(comment => {
        const user =
          normalizeUser(
            comment.users
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
      })
      .join("");

  refreshIcons();
}

async function sendComment() {
  const input =
    $("commentInput");

  const content =
    input?.value.trim() || "";

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

    await loadPosts();

    await openComments(
      state.currentPostId
    );

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
      story =>
        String(
          story.user_id
        ) ===
        String(userId)
    );

  if (!group.length) {
    if (
      String(userId) ===
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

  renderCurrentStory();

  openModal(
    "storyViewer"
  );
}

function renderCurrentStory() {
  const story =
    state.currentStoryGroup[
      state.currentStoryIndex
    ];

  if (!story) {
    return;
  }

  const media =
    $("storyViewerMedia");

  if (media) {
    media.innerHTML = "";

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

      video.autoplay = true;
      video.muted = true;
      video.controls = true;
      video.playsInline = true;

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

      image.alt = "";

      media.appendChild(
        image
      );
    }
  }

  const text =
    $("storyViewerText");

  if (text) {
    text.textContent =
      story.story_text || "";

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

  const userBox =
    $("storyViewerUser");

  if (userBox) {
    userBox.innerHTML = `
      ${avatarMarkup(
        story.user,
        "avatar story-viewer-avatar"
      )}
      <span>
        <strong>
          ${escapeHtml(
            story.user.display_name ||
            story.user.username ||
            "User"
          )}
        </strong>
        <small>
          @${escapeHtml(
            story.user.username ||
            "user"
          )}
        </small>
      </span>
    `;
  }

  if (
    story.filter ===
    "bw" &&
    media
  ) {
    media.style.filter =
      "grayscale(1)";
  } else if (
    story.filter ===
    "warm" &&
    media
  ) {
    media.style.filter =
      "sepia(.35) saturate(1.25)";
  } else if (media) {
    media.style.filter =
      "none";
  }

  refreshIcons();
}

function nextStory() {
  if (
    !state.currentStoryGroup.length
  ) {
    return;
  }

  if (
    state.currentStoryIndex <
    state.currentStoryGroup.length -
      1
  ) {
    state.currentStoryIndex +=
      1;

    renderCurrentStory();
  } else {
    closeModal(
      "storyViewer"
    );
  }
}

function previousStory() {
  if (
    !state.currentStoryGroup.length
  ) {
    return;
  }

  if (
    state.currentStoryIndex > 0
  ) {
    state.currentStoryIndex -=
      1;

    renderCurrentStory();
  }
}

async function performSearch(
  query
) {
  const normalized =
    String(query || "")
      .trim()
      .toLowerCase();

  state.searchQuery =
    normalized;

  const target =
    $("searchResults");

  const home =
    $("searchHome");

  if (!target) {
    return;
  }

  if (!normalized) {
    target.innerHTML = "";

    if (home) {
      home.style.display =
        "block";
    }

    return;
  }

  if (home) {
    home.style.display =
      "none";
  }

  const users = [];
  const seen =
    new Set();

  const addUser = user => {
    const value =
      normalizeUser(user);

    if (
      !value.id ||
      seen.has(
        String(value.id)
      )
    ) {
      return;
    }

    seen.add(
      String(value.id)
    );

    users.push(value);
  };

  state.posts.forEach(
    post =>
      addUser(post.user)
  );

  addUser(
    state.user
  );

  const people =
    users.filter(user => {
      const username =
        user.username
          .toLowerCase();

      const name =
        user.display_name
          .toLowerCase();

      return (
        username.includes(
          normalized.replace(
            /^@/,
            ""
          )
        ) ||
        name.includes(
          normalized
        )
      );
    });

  const hashtag =
    normalized.startsWith("#")
      ? normalized.slice(1)
      : "";

  const posts =
    state.posts.filter(
      post => {
        const text =
          String(
            post.content || ""
          ).toLowerCase();

        if (
          hashtag
        ) {
          return hashtagsFromText(
            post.content
          ).includes(
            hashtag
          );
        }

        return text.includes(
          normalized
        );
      }
    );

  const results = [];

  if (people.length) {
    results.push(`
      <section class="search-section">
        <div class="search-section-head">
          <h3>People</h3>
          <span>
            ${people.length}
          </span>
        </div>

        <div class="search-people">
          ${people
            .map(
              user => `
                <button
                  type="button"
                  class="search-person"
                  data-profile-user="${escapeHtml(
                    user.id
                  )}"
                >
                  ${avatarMarkup(
                    user,
                    "avatar small"
                  )}

                  <span>
                    <strong>
                      ${escapeHtml(
                        user.display_name
                      )}
                    </strong>

                    <small>
                      @${escapeHtml(
                        user.username
                      )}
                    </small>
                  </span>

                  ${
                    user.verified
                      ? `
                        <i data-lucide="badge-check"></i>
                      `
                      : ""
                  }
                </button>
              `
            )
            .join("")}
        </div>
      </section>
    `);
  }

  if (posts.length) {
    results.push(`
      <section class="search-section">
        <div class="search-section-head">
          <h3>Posts</h3>
          <span>
            ${posts.length}
          </span>
        </div>

        <div class="search-posts">
          ${posts
            .map(postMarkup)
            .join("")}
        </div>
      </section>
    `);
  }

  if (!results.length) {
    results.push(`
      <div class="empty-state">
        <i data-lucide="search-x"></i>
        <h2>No results found</h2>
        <p>
          Try another name,
          post or hashtag.
        </p>
      </div>
    `);
  }

  target.innerHTML =
    results.join("");

  refreshIcons();
}

function renderWheel() {
  const wheel =
    $("wheel");

  if (!wheel) {
    return;
  }

  const stored =
    Number(
      localStorage.getItem(
        ARS_WHEEL_STORAGE_KEY
      )
    );

  state.wheelSpins =
    Number.isFinite(stored) &&
    stored >= 0
      ? stored
      : ARS_WHEEL_FREE_SPINS;

  if (!wheel.dataset.ready) {
    wheel.innerHTML =
      WHEEL_CHALLENGES.map(
        challenge => `
          <div
            class="wheel-segment"
          >
            ${escapeHtml(
              challenge.category
            )}
          </div>
        `
      ).join("");

    wheel.dataset.ready =
      "true";
  }

  const counter =
    $("spinCounter");

  if (counter) {
    counter.textContent =
      state.wheelSpins > 0
        ? `${state.wheelSpins} free spins remaining`
        : "No free spins remaining";
  }

  const button =
    $("spinButton");

  if (button) {
    button.disabled =
      state.wheelSpins <= 0;
  }

  const plan =
    $("planLabel");

  if (plan) {
    plan.textContent =
      state.user?.plan ||
      "Free";
  }

  refreshIcons();
}

function spinWheel() {
  if (
    state.wheelSpins <= 0
  ) {
    showToast(
      "No free spins remaining."
    );
    return;
  }

  const wheel =
    $("wheel");

  if (!wheel) {
    return;
  }

  state.wheelSpins -= 1;

  localStorage.setItem(
    ARS_WHEEL_STORAGE_KEY,
    String(
      state.wheelSpins
    )
  );

  const index =
    Math.floor(
      Math.random() *
        WHEEL_CHALLENGES.length
    );

  const challenge =
    WHEEL_CHALLENGES[index];

  const rotation =
    360 * 5 +
    Math.floor(
      Math.random() * 360
    );

  state.wheelRotation +=
    rotation;

  wheel.style.transform =
    `rotate(${state.wheelRotation}deg)`;

  const result =
    $("challengeResult");

  if (result) {
    result.textContent =
      `${challenge.title} · Reward: ${challenge.reward} XP`;
  }

  renderWheel();
}

function renderStreakPartners() {
  const count =
    $("streakPartnersCount");

  const list =
    $("streakPartnersList");

  if (count) {
    count.textContent =
      "0";
  }

  if (list) {
    list.innerHTML = "";
  }
}

function handleDiscoverTag(
  tag
) {
  const value =
    String(tag || "")
      .trim()
      .toLowerCase()
      .replace(/^#/, "");

  if (!value) {
    return;
  }

  showPage(
    "searchPage"
  );

  const input =
    $("searchInput");

  if (input) {
    input.value =
      "#" + value;
  }

  performSearch(
    "#" + value
  );
}

async function deletePost(
  postId
) {
  const post =
    state.posts.find(
      item =>
        String(item.id) ===
        String(postId)
    );

  if (!post) {
    return;
  }

  if (
    String(post.user_id) !==
    String(state.user?.id)
  ) {
    showToast(
      "You can only delete your own post."
    );
    return;
  }

  try {
    const {
      error
    } =
      await supabaseClient
        .from("posts")
        .delete()
        .eq(
          "id",
          postId
        )
        .eq(
          "user_id",
          state.user.id
        );

    if (error) {
      throw error;
    }

    state.posts =
      state.posts.filter(
        item =>
          String(item.id) !==
          String(postId)
      );

    renderPosts();
    renderTrending();

    showToast(
      "Post deleted."
    );
  } catch (error) {
    safeError(
      "delete-post",
      error
    );

    showToast(
      error.message ||
      "Unable to delete post."
    );
  }
}

function bindEvents() {
  document.addEventListener(
    "click",
    async event => {
      const nav =
        event.target.closest(
          ".nav-item[data-page]"
        );

      if (nav) {
        showPage(
          nav.dataset.page
        );
        return;
      }

      const action =
        event.target.closest(
          "[data-action]"
        );

      if (action) {
        await togglePostAction(
          action.dataset.action,
          action.dataset.id
        );
        return;
      }

      const story =
        event.target.closest(
          "[data-story-user]"
        );

      if (story) {
        openStoryGroup(
          story.dataset.storyUser
        );
        return;
      }

      const profile =
        event.target.closest(
          "[data-profile-user]"
        );

      if (profile) {
        await openProfileFromUser(
          profile.dataset.profileUser
        );
        return;
      }

      const trend =
        event.target.closest(
          "[data-trending-tag]"
        );

      if (trend) {
        handleDiscoverTag(
          trend.dataset.trendingTag
        );
        return;
      }

      const discover =
        event.target.closest(
          "[data-discover-tag]"
        );

      if (discover) {
        handleDiscoverTag(
          discover.dataset.discoverTag
        );
        return;
      }

      const hashtag =
        event.target.closest(
          "[data-hashtag]"
        );

      if (hashtag) {
        handleDiscoverTag(
          hashtag.dataset.hashtag
        );
        return;
      }

      const menu =
        event.target.closest(
          "[data-post-menu]"
        );

      if (menu) {
        const post =
          state.posts.find(
            item =>
              String(
                item.id
              ) ===
              String(
                menu.dataset
                  .postMenu
              )
          );

        if (
          post &&
          String(
            post.user_id
          ) ===
            String(
              state.user?.id
            )
        ) {
          const remove =
            window.confirm(
              "Delete this post?"
            );

          if (remove) {
            await deletePost(
              post.id
            );
          }
        }

        return;
      }
    }
  );

  $("createPost")
    ?.addEventListener(
      "click",
      openPostComposer
    );

  $("createPostClose")
    ?.addEventListener(
      "click",
      () =>
        closeModal(
          "createPostModal"
        )
    );

  $("publishPost")
    ?.addEventListener(
      "click",
      publishPost
    );

  $("pickPostImage")
    ?.addEventListener(
      "click",
      () =>
        $("createPostImage")
          ?.click()
    );

  $("createPostImage")
    ?.addEventListener(
      "change",
      event =>
        handlePostFile(
          event.target
            .files?.[0]
        )
    );

  $("createStoryClose")
    ?.addEventListener(
      "click",
      () =>
        closeModal(
          "createStoryModal"
        )
    );

  $("storyImage")
    ?.addEventListener(
      "change",
      event =>
        handleStoryFile(
          event.target
            .files?.[0]
        )
    );

  $("pickStoryImage")
    ?.addEventListener(
      "click",
      () =>
        $("storyImage")
          ?.click()
    );

  $("publishStory")
    ?.addEventListener(
      "click",
      publishStory
    );

  $("storyDeleteMedia")
    ?.addEventListener(
      "click",
      () => {
        state.storyFile =
          null;

        state.storyMediaData =
          null;

        updateStoryEditorPreview();
      }
    );

  $("storyZoomIn")
    ?.addEventListener(
      "click",
      () => {
        state.storyZoom =
          Math.min(
            2,
            state.storyZoom +
              0.1
          );

        updateStoryEditorPreview();
      }
    );

  $("storyZoomOut")
    ?.addEventListener(
      "click",
      () => {
        state.storyZoom =
          Math.max(
            0.5,
            state.storyZoom -
              0.1
          );

        updateStoryEditorPreview();
      }
    );

  $("storyFilterButton")
    ?.addEventListener(
      "click",
      () => {
        state.storyFilter =
          state.storyFilter ===
          "none"
            ? "bw"
            : state.storyFilter ===
              "bw"
              ? "warm"
              : "none";

        updateStoryEditorPreview();
      }
    );

  $("storyStickerButton")
    ?.addEventListener(
      "click",
      () => {
        state.storySticker =
          state.storySticker
            ? null
            : "★";

        updateStoryEditorPreview();
      }
    );

  $("storyText")
    ?.addEventListener(
      "input",
      updateStoryEditorPreview
    );

  $("storyPosition")
    ?.addEventListener(
      "change",
      updateStoryEditorPreview
    );

  $("storyTextColor")
    ?.addEventListener(
      "input",
      updateStoryEditorPreview
    );

  $("storyPasteButton")
    ?.addEventListener(
      "click",
      async () => {
        try {
          const text =
            await navigator
              .clipboard
              .readText();

          const input =
            $("storyText");

          if (input) {
            input.value =
              text;
          }

          updateStoryEditorPreview();
        } catch (error) {
          safeError(
            "clipboard",
            error
          );

          showToast(
            "Clipboard access is unavailable."
          );
        }
      }
    );

  $("storyViewerClose")
    ?.addEventListener(
      "click",
      () =>
        closeModal(
          "storyViewer"
        )
    );

  $("storyViewerPrev")
    ?.addEventListener(
      "click",
      previousStory
    );

  $("storyViewerNext")
    ?.addEventListener(
      "click",
      nextStory
    );

  $("commentsClose")
    ?.addEventListener(
      "click",
      () =>
        closeModal(
          "commentsModal"
        )
    );

  $("sendComment")
    ?.addEventListener(
      "click",
      sendComment
    );

  $("commentInput")
    ?.addEventListener(
      "keydow
      event => {
        if (
          event.key ===
          "Enter"
        ) {
          event.preventDefault();
          sendComment();
        }
      }
    );

  $("profileButton")
    ?.addEventListener(
      "click",
      () =>
        showPage(
          "profilePage"
        )
    );

  $("wheelButton")
    ?.addEventListener(
      "click",
      () =>
        showPage(
          "wheelPage"
        )
    );

  $("wheelBackButton")
    ?.addEventListener(
      "click",
      () =>
        showPage(
          "homePage"
        )
    );

  $("wheelExitButton")
    ?.addEventListener(
      "click",
      () =>
        showPage(
          "homePage"
        )
    );

  $("spinButton")
    ?.addEventListener(
      "click",
      spinWheel
    );

  $("wheelSubscribeButton")
    ?.addEventListener(
      "click",
      () =>
        showToast(
          "Subscription is handled by the ARS subscription system."
        )
    );

  $("searchInput")
    ?.addEventListener(
      "input",
      event =>
        performSearch(
          event.target.value
        )
    );

  document
    .querySelectorAll(
      ".modal"
    )
    .forEach(modal => {
      modal.addEventListener(
        "click",
        event => {
          if (
            event.target ===
            modal
          ) {
            closeModal(
              modal.id
            );
          }
        }
      );
    });
}

async function initializeHome() {
  if (
    state.initialized
  ) {
    return;
  }

  bindEvents();
  refreshIcons();

  await loadAll();

  renderWheel();
  renderStreakPartners();
}

if (
  document.readyState ===
  "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",
    initializeHome,
    {
      once: true
    }
  );
} else {
  initializeHome();
}
