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
const ARS_WHEEL_STORAGE_KEY = "ars_wheel_spins";

const $ = (id) =>
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

  wheelSpins: 0,
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
      typeof window.ARSErrors.capture === "function"
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
    return `${(number / 1000000).toFixed(1)}M`;
  }

  if (number >= 1000) {
    return `${(number / 1000).toFixed(1)}K`;
  }

  return String(number);
}

function timeAgo(date) {
  const time =
    new Date(date).getTime();

  if (!time) {
    return "";
  }

  const seconds =
    Math.floor(
      (Date.now() - time) / 1000
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

  return new Date(date)
    .toLocaleDateString();
}

function refreshIcons() {
  try {
    if (window.lucide) {
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
  const toast =
    $("toast");

  if (!toast) {
    return;
  }

  toast.textContent =
    String(message);

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
  const normalized =
    normalizeUser(user);

  if (normalized.avatar) {
    return `
      <span class="${escapeHtml(className)}">
        <img
          src="${escapeHtml(
            normalized.avatar
          )}"
          alt=""
        >
      </span>
    `;
  }

  const letter =
    (
      normalized.display_name ||
      normalized.username ||
      "A"
    )
      .trim()
      .charAt(0)
      .toUpperCase() || "A";

  return `
    <span class="${escapeHtml(className)}">
      ${escapeHtml(letter)}
    </span>
  `;
}

function normalizePost(row) {
  const value =
    row || {};

  const user =
    normalizeUser(
      value.users ||
      value.user ||
      {}
    );

  return {
    id:
      value.id,
    created_at:
      value.created_at,
    user_id:
      value.user_id,
    user,
    content:
      value.content || "",
    image:
      value.image || "",
    likes_count:
      Number(value.likes_count || 0),
    comments_count:
      Number(value.comments_count || 0),
    reposts_count:
      Number(value.reposts_count || 0),
    views_count:
      Number(value.views_count || 0),
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

  return {
    id:
      value.id,
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
    image:
      value.image || "",
    viewers_count:
      Number(
        value.viewers_count || 0
      ),
    expires_at:
      value.expires_at,
    media_type:
      value.media_type ||
      (
        String(
          value.image || ""
        ).startsWith(
          "data:video/"
        )
          ? "video"
          : "image"
      ),
    story_text:
      value.story_text || "",
    text_position:
      value.text_position ||
      "center",
    text_color:
      value.text_color ||
      "#ffffff",
    filter:
      value.filter ||
      "none",
    sticker:
      value.sticker ||
      null,
    zoom:
      Number(value.zoom || 1)
  };
}

function isStoryActive(story) {
  if (!story?.expires_at) {
    return true;
  }

  const expires =
    new Date(
      story.expires_at
    ).getTime();

  if (!Number.isFinite(expires)) {
    return true;
  }

  return expires > Date.now();
}

function hashtagsFromText(text) {
  const matches =
    String(text || "")
      .match(
        /#[\p{L}\p{N}_]+/gu
      ) || [];

  return [
    ...new Set(
      matches.map(
        (tag) =>
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
    data: {
      user: authUser
    },
    error: authError
  } =
    await supabaseClient.auth.getUser();

  if (authError) {
    throw authError;
  }

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

  return normalizeUser(
    data || {
      id: authUser.id,
      email: authUser.email
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

  const postIds =
    state.posts
      .map(post => post.id)
      .filter(Boolean);

  if (!postIds.length) {
    return;
  }

  const [
    likesResult,
    repostsResult,
    bookmarksResult
  ] = await Promise.all([
    supabaseClient
      .from("likes")
      .select("post_id")
      .eq(
        "user_id",
        state.user.id
      )
      .in(
        "post_id",
        postIds
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
        postIds
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
        postIds
      )
  ]);

  if (likesResult.error) {
    safeError(
      "load-likes",
      likesResult.error
    );
  }

  if (repostsResult.error) {
    safeError(
      "load-reposts",
      repostsResult.error
    );
  }

  if (bookmarksResult.error) {
    safeError(
      "load-bookmarks",
      bookmarksResult.error
    );
  }

  const liked =
    new Set(
      (likesResult.data || [])
        .map(item =>
          String(item.post_id)
        )
    );

  const reposted =
    new Set(
      (repostsResult.data || [])
        .map(item =>
          String(item.post_id)
        )
    );

  const bookmarked =
    new Set(
      (bookmarksResult.data || [])
        .map(item =>
          String(item.post_id)
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
      "load",
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

  if (
    state.searchQuery
  ) {
    performSearch(
      state.searchQuery
    );
  } else {
    const searchHome =
      $("searchHome");

    if (searchHome) {
      searchHome.style.display =
        "block";
    }
  }

  renderWheel();
  refreshIcons();
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

  renderStreak();
  refreshIcons();
}

function renderStories() {
  const container =
    $("stories");

  if (!container) {
    return;
  }

  const activeStories =
    state.stories.filter(
      isStoryActive
    );

  const groups =
    new Map();

  activeStories.forEach(
    story => {
      if (!story.user_id) {
        return;
      }

      const key =
        String(story.user_id);

      if (!groups.has(key)) {
        groups.set(
          key,
          []
        );
      }

      groups.get(key).push(
        story
      );
    }
  );

  if (state.user?.id) {
    const ownKey =
      String(state.user.id);

    if (!groups.has(ownKey)) {
      groups.set(
        ownKey,
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

  if (!entries.length) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML =
    entries.map(
      ([userId, stories]) => {
        const user =
          stories[0]?.user ||
          (
            String(userId) ===
            String(
              state.user?.id
            )
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
    ).join("");

  refreshIcons();
}

function postMarkup(post) {
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
      list.map(
        postMarkup
      ).join("");
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

  const rows =
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

  const live =
    rows.map(
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
              #${escapeHtml(tag)}
            </strong>

            <span>
              ${count} posts
            </span>
          </div>

          <i data-lucide="chevron-right"></i>
        </button>
      `
    );

  const preview =
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
              #${escapeHtml(tag)}
            </strong>

            <span>
              ${escapeHtml(label)}
              · Discover topic
            </span>
          </div>

          <i data-lucide="chevron-right"></i>
        </button>
      `
    );

  target.innerHTML =
    live.length
      ? (
          live.join("") +
          `
            <div class="trend-preview">
              <span>
                Discover more
              </span>

              <p>
                Suggested topics are
                discovery categories,
                not live trend counts.
              </p>
            </div>
          ` +
          preview.join("")
        )
      : preview.join("");

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
      value
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
    state.user &&
    String(userId) ===
    String(state.user.id)
  ) {
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
    .forEach(
      page => {
        page.classList.toggle(
          "active",
          page.id === pageId
        );
      }
    );

  document
    .querySelectorAll(
      ".nav-item[data-page]"
    )
    .forEach(
      button => {
        button.classList.toggle(
          "active",
          button.dataset.page ===
            pageId
        );
      }
    );

  window.scrollTo({
    top: 0,
    behavior: "smooth"
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
    $("searchInput")?.focus();
  }

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

  const image =
    $("createPostImage");

  if (image) {
    image.value = "";
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
    input.accept =
      "image/*,video/*";
  }

  const canvas =
    $("storyCanvas");

  canvas
    ?.querySelector(
      ".ars-story-editor-media"
    )
    ?.remove();

  if (
    $("storyCanvasEmpty")
  ) {
    $("storyCanvasEmpty")
      .style.display =
      "flex";
  }

  if (
    $("storyImagePreview")
  ) {
    $("storyImagePreview")
      .style.display =
      "none";

    $("storyImagePreview")
      .removeAttribute(
        "src"
      );
  }

  if ($("storyText")) {
    $("storyText").value =
      "";
  }

  if (
    $("storyTextPreview")
  ) {
    $("storyTextPreview")
      .textContent = "";

    $("storyTextPreview")
      .style.color =
      "#fff";
  }

  if (
    $("storyPosition")
  ) {
    $("storyPosition")
      .value =
      "center";
  }

  if (
    $("storyTextColor")
  ) {
    $("storyTextColor")
      .value =
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

  const isVideo =
    file.type.startsWith(
      "video/"
    );

  const isImage =
    file.type.startsWith(
      "image/"
    );

  if (!isVideo && !isImage) {
    showToast(
      "Choose an image or video."
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

  if (!canvas) {
    return;
  }

  let media =
    canvas.querySelector(
      ".ars-story-editor-media"
    );

  if (state.storyMediaData) {
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

        media.muted = true;
        media.loop = true;
        media.autoplay = true;
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

    if (
      $("storyCanvasEmpty")
    ) {
      $("storyCanvasEmpty")
        .style.display =
        "none";
    }
  } else {
    media?.remove();

    if (
      $("storyCanvasEmpty")
    ) {
      $("storyCanvasEmpty")
        .style.display =
        "flex";
    }
  }

  const preview =
    $("storyTextPreview");

  if (preview) {
    const text =
      $("storyText")
        ?.value || "";

    const position =
      $("storyPosition")
        ?.value ||
      "center";

    preview.textContent =
      text;

    preview.style.color =
      $("storyTextColor")
        ?.value ||
      "#ffffff";

    preview.style.top =
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

    state.posts.unshift(
      normalizePost(data)
    );

    closeModal(
      "createPostModal"
    );

    renderPosts();
    renderTrending();

    resetPostComposer();

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

    state.stories.unshift(
      normalizeStory(data)
    );

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

  if (action === "comment") {
    await openComments(
      postId
    );
    return;
  }

  if (action === "view") {
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
        : "bookmarks";

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
      "comments-load",
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
    comments.map(
      comment => {
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
      }
    ).join("");

  refreshIcons();
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

      video.autoplay =
        true;

      video.muted =
        true;

      video.playsInline =
        true;

      video.controls =
        false;

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

      image.alt = "";

      image.className =
        "story-viewer-image";

      media.appendChild(
        image
      );
    }
  }

  const text =
    $("storyViewerText");

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

  const user =
    $("storyViewerUser");

  if (user) {
    user.innerHTML = `
      ${avatarMarkup(
        story.user,
        "avatar viewer-avatar"
      )}

      <div>
        <strong>
          ${escapeHtml(
            story.user.display_name
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

  try {
    const {
      data: existing,
      error: selectError
    } =
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

    if (selectError) {
      throw selectError;
    }

    if (existing) {
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
      throw error;
    }

    story.viewers_count =
      Number(
        story.viewers_count || 0
      ) + 1;
  } catch (error) {
    safeError(
      "story-view",
      error
    );
  }
}

function nextStory() {
  if (
    state.currentStoryIndex >=
    state.currentStoryGroup
      .length - 1
  ) {
    closeModal(
      "storyViewer"
    );
    return;
  }

  state.currentStoryIndex +=
    1;

  renderStoryViewer();

  recordStoryView(
    state.currentStoryGroup[
      state.currentStoryIndex
    ]
  );
}

function previousStory() {
  if (
    state.currentStoryIndex <=
    0
  ) {
    return;
  }

  state.currentStoryIndex -=
    1;

  renderStoryViewer();

  recordStoryView(
    state.currentStoryGroup[
      state.currentStoryIndex
    ]
  );
}

function getWheelStorage() {
  try {
    const raw =
      localStorage.getItem(
        ARS_WHEEL_STORAGE_KEY
      );

    if (!raw) {
      return {
        spins: 0
      };
    }

    const value =
      JSON.parse(raw);

    return {
      spins:
        Number(
          value.spins || 0
        )
    };
  } catch (_) {
    return {
      spins: 0
    };
  }
}

function saveWheelStorage(
  spins
) {
  try {
    localStorage.setItem(
      ARS_WHEEL_STORAGE_KEY,
      JSON.stringify({
        spins
      })
    );
  } catch (error) {
    safeError(
      "wheel-storage",
      error
    );
  }

  state.wheelSpins =
    Number(spins || 0);
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

function renderWheelSegments() {
  const wheel =
    $("wheel");

  if (!wheel) {
    return;
  }

  const count =
    WHEEL_CHALLENGES.length;

  const angle =
    360 / count;

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
          style="--angle:${
            index * angle
          }deg"
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

  refreshIcons();
}
function renderWheel() {
  renderWheelSegments();

  const remaining =
    wheelRemainingSpins();

  const counter =
    $("spinCounter");

  if (counter) {
    counter.textContent =
      remaining === Infinity
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

  const button =
    $("spinButton");

  if (button) {
    button.disabled =
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
        ? "inline-flex"
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
    index * segmentAngle -
    segmentAngle / 2;

  state.wheelRotation +=
    1800 +
    targetAngle;

  wheel.style.transform =
    `rotate(${state.wheelRotation}deg)`;

  if (
    state.user?.plan !==
    "premium"
  ) {
    saveWheelStorage(
      state.wheelSpins + 1
    );
  }

  const button =
    $("spinButton");

  if (button) {
    button.disabled =
      true;
  }

  setTimeout(
    async () => {
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

      await saveChallengeReward(
        challenge.reward
      );

      renderWheel();

      if (
        wheelRemainingSpins() ===
        0
      ) {
        showToast(
          "Free spins finished. Subscribe for more."
        );
      }
    },
    1350
  );
}

async function saveChallengeReward(
  reward
) {
  if (
    !state.user?.id ||
    !Number.isFinite(
      Number(reward)
    )
  ) {
    return;
  }

  const nextXp =
    Number(
      state.user.xp || 0
    ) +
    Number(reward);

  try {
    const {
      error
    } =
      await supabaseClient
        .from("users")
        .update({
          xp: nextXp
        })
        .eq(
          "id",
          state.user.id
        );

    if (error) {
      throw error;
    }

    state.user.xp =
      nextXp;
  } catch (error) {
    safeError(
      "wheel-reward",
      error
    );
  }
}

function performSearch(
  query
) {
  const home =
    $("searchHome");

  const results =
    $("searchResults");

  if (!home || !results) {
    return;
  }

  const value =
    String(query || "")
      .trim()
      .toLowerCase();

  state.searchQuery =
    value;

  if (!value) {
    home.style.display =
      "block";

    results.innerHTML =
      "";

    return;
  }

  home.style.display =
    "none";

  const users =
    new Map();

  state.posts.forEach(
    post => {
      if (post.user?.id) {
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
      .filter(user => {
        const haystack =
          `${user.display_name || ""} ${
            user.username || ""
          }`.toLowerCase();

        return haystack.includes(
          value
        );
      });

  const matchingPosts =
    state.posts.filter(
      post => {
        const content =
          String(
            post.content || ""
          ).toLowerCase();

        const name =
          String(
            post.user
              ?.display_name ||
            ""
          ).toLowerCase();

        const username =
          String(
            post.user
              ?.username ||
            ""
          ).toLowerCase();

        const tags =
          hashtagsFromText(
            post.content
          ).join(" ");

        return (
          content.includes(value) ||
          name.includes(value) ||
          username.includes(value) ||
          tags.includes(
            value.replace(
              /^#/,
              ""
            )
          )
        );
      }
    );

  results.innerHTML =
    "";

  if (
    !people.length &&
    !matchingPosts.length
  ) {
    results.innerHTML = `
      <div class="empty-state">
        <i data-lucide="search"></i>

        <strong>
          No results found
        </strong>

        <span>
          Try another name,
          username, hashtag,
          or keyword.
        </span>
      </div>
    `;

    refreshIcons();
    return;
  }

  if (people.length) {
    const usersSection =
      document.createElement(
        "div"
      );

    usersSection.className =
      "search-section";

    usersSection.innerHTML = `
      <div class="search-section-title">
        <span>People</span>
      </div>

      <div class="search-users"></div>
    `;

    const usersContainer =
      usersSection.querySelector(
        ".search-users"
      );

    people.forEach(
      user => {
        const item =
          document.createElement(
            "button"
          );

        item.type =
          "button";

        item.className =
          "search-user-item";

        item.innerHTML = `
          ${avatarMarkup(
            user,
            "avatar search-user-avatar"
          )}

          <div class="search-user-info">
            <strong>
              ${escapeHtml(
                user.display_name ||
                user.username ||
                "User"
              )}
            </strong>

            <span>
              @${escapeHtml(
                user.username ||
                ""
              )}
            </span>
          </div>

          <i data-lucide="chevron-right"></i>
        `;

        item.addEventListener(
          "click",
          () => {
            openProfileFromUser(
              user.id
            );
          }
        );

        usersContainer.appendChild(
          item
        );
      }
    );

    results.appendChild(
      usersSection
    );
  }

  if (matchingPosts.length) {
    const postsSection =
      document.createElement(
        "div"
      );

    postsSection.className =
      "search-section";

    postsSection.innerHTML = `
      <div class="search-section-title">
        <span>Posts</span>
      </div>

      <div class="search-posts"></div>
    `;

    const postsContainer =
      postsSection.querySelector(
        ".search-posts"
      );

    matchingPosts.forEach(
      post => {
        const wrapper =
          document.createElement(
            "div"
          );

        wrapper.innerHTML =
          postMarkup(post);

        const element =
          wrapper.firstElementChild;

        if (element) {
          postsContainer.appendChild(
            element
          );
        }
      }
    );

    results.appendChild(
      postsSection
    );
  }

  refreshIcons();
}

function searchForTag(tag) {
  const clean =
    String(tag || "")
      .trim()
      .replace(/^#/, "");

  if (!clean) {
    return;
  }

  showPage(
    "searchPage"
  );

  const input =
    $("searchInput");

  if (input) {
    input.value =
      `#${clean}`;
  }

  performSearch(
    `#${clean}`
  );
}

function handlePostMenu(
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

  const backdrop =
    $("postMenuBackdrop");

  if (!backdrop) {
    showToast(
      "Post menu is not available."
    );
    return;
  }

  backdrop.classList.add(
    "open"
  );

  backdrop.innerHTML = `
    <div class="post-menu">
      <button
        type="button"
        data-menu-action="close"
      >
        <i data-lucide="x"></i>
        Close
      </button>

      ${
        String(
          post.user_id
        ) ===
        String(
          state.user?.id
        )
          ? `
            <button
              type="button"
              data-menu-action="profile"
            >
              <i data-lucide="user"></i>
              View profile
            </button>
          `
          : `
            <button
              type="button"
              data-menu-action="profile"
            >
              <i data-lucide="user"></i>
              View profile
            </button>

            <button
              type="button"
              data-menu-action="report"
            >
              <i data-lucide="flag"></i>
              Report
            </button>
          `
      }
    </div>
  `;

  backdrop.dataset.postId =
    String(postId);

  refreshIcons();
}

function closePostMenu() {
  const backdrop =
    $("postMenuBackdrop");

  if (!backdrop) {
    return;
  }

  backdrop.classList.remove(
    "open"
  );

  backdrop.innerHTML =
    "";

  delete backdrop.dataset
    .postId;
}

function bindEvents() {
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
      event => {
        const file =
          event.target
            ?.files?.[0];

        handlePostFile(
          file
        );
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

  $("openStreakFromWheel")
    ?.addEventListener(
      "click",
      () =>
        showPage(
          "streakPage"
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
      () => {
        const target =
          document.querySelector(
            "[data-page='subscriptionPage']"
          );

        if (target) {
          showPage(
            "subscriptionPage"
          );
        } else {
          showToast(
            "Subscription is available from your account."
          );
        }
      }
    );

  $("createStoryClose")
    ?.addEventListener(
      "click",
      () =>
        closeModal(
          "createStoryModal"
        )
    );

  $("publishStory")
    ?.addEventListener(
      "click",
      publishStory
    );

  $("storyImage")
    ?.addEventListener(
      "change",
      event => {
        const file =
          event.target
            ?.files?.[0];

        handleStoryFile(
          file
        );
      }
    );

  $("pickStoryImage")
    ?.addEventListener(
      "click",
      () =>
        $("storyImage")
          ?.click()
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

  $("storyFilterButton")
    ?.addEventListener(
      "click",
      () => {
        const filters = [
          "none",
          "bw",
          "warm"
        ];

        const current =
          filters.indexOf(
            state.storyFilter
          );

        state.storyFilter =
          filters[
            (
              current + 1
            ) %
              filters.length
          ];

        updateStoryEditorPreview();

        showToast(
          `Filter: ${state.storyFilter}`
        );
      }
    );

  $("storyStickerButton")
    ?.addEventListener(
      "click",
      () => {
        state.storySticker =
          state.storySticker
            ? null
            : "sparkles";

        showToast(
          state.storySticker
            ? "Sticker added."
            : "Sticker removed."
        );
      }
    );

  $("storyCropButton")
    ?.addEventListener(
      "click",
      () => {
        showToast(
          "Story crop keeps the current media framing."
        );
      }
    );

  $("storyDeleteMedia")
    ?.addEventListener(
      "click",
      () => {
        state.storyFile =
          null;

        state.storyMediaData =
          null;

        state.storyMediaType =
          "image";

        updateStoryEditorPreview();

        const input =
          $("storyImage");

        if (input) {
          input.value =
            "";
        }
      }
    );

  $("storyPasteButton")
    ?.addEventListener(
      "click",
      async () => {
        try {
          if (
            !navigator.clipboard ||
            !navigator.clipboard
              .readText
          ) {
            throw new Error(
              "Clipboard unavailable"
            );
          }

          const text =
            await navigator
              .clipboard
              .readText();

          const textarea =
            $("storyText");

          if (textarea) {
            textarea.value =
              text;

            updateStoryEditorPreview();
          }
        } catch (error) {
          safeError(
            "story-paste",
            error
          );

          showToast(
            "Clipboard access is unavailable."
          );
        }
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

  $("storyViewerClose")
    ?.addEventListener(
      "click",
      () =>
        closeModal(
          "storyViewer"
        )
    );

  $("storyViewerNext")
    ?.addEventListener(
      "click",
      nextStory
    );

  $("storyViewerPrev")
    ?.addEventListener(
      "click",
      previousStory
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
      "keydown",
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

  $("searchInput")
    ?.addEventListener(
      "input",
      event => {
        performSearch(
          event.target.value
        );
      }
    );

  document
    .querySelectorAll(
      ".nav-item[data-page]"
    )
    .forEach(
      button => {
        button.addEventListener(
          "click",
          () => {
            showPage(
              button.dataset
                .page
            );
          }
        );
      }
    );

  document
    .querySelectorAll(
      "[data-discover-tag]"
    )
    .forEach(
      button => {
        button.addEventListener(
          "click",
          () => {
            searchForTag(
              button.dataset
                .discoverTag
            );
          }
        );
      }
    );

  document.addEventListener(
    "click",
    event => {
      const story =
        event.target.closest(
          "[data-story-user]"
        );

      if (story) {
        openStoryGroup(
          story.dataset
            .storyUser
        );
        return;
      }

      const profile =
        event.target.closest(
          "[data-profile-user]"
        );

      if (profile) {
        openProfileFromUser(
          profile.dataset
            .profileUser
        );
        return;
      }

      const action =
        event.target.closest(
          "[data-action]"
        );

      if (action) {
        togglePostAction(
          action.dataset
            .action,
          action.dataset.id
        );
        return;
      }

      const hashtag =
        event.target.closest(
          "[data-hashtag]"
        );

      if (hashtag) {
        searchForTag(
          hashtag.dataset
            .hashtag
        );
        return;
      }

      const trend =
        event.target.closest(
          "[data-trending-tag]"
        );

      if (trend) {
        searchForTag(
          trend.dataset
            .trendingTag
        );
        return;
      }

      const menu =
        event.target.closest(
          "[data-post-menu]"
        );

      if (menu) {
        handlePostMenu(
          menu.dataset
            .postMenu
        );
      }
    }
  );

  $("postMenuBackdrop")
    ?.addEventListener(
      "click",
      event => {
        const action =
          event.target.closest(
            "[data-menu-action]"
          );

        if (!action) {
          if (
            event.target ===
            $("postMenuBackdrop")
          ) {
            closePostMenu();
          }

          return;
        }

        const postId =
          $("postMenuBackdrop")
            ?.dataset?.postId;

        if (
          action.dataset
            .menuAction ===
          "close"
        ) {
          closePostMenu();
          return;
        }

        if (
          action.dataset
            .menuAction ===
          "profile"
        ) {
          closePostMenu();

          const post =
            state.posts.find(
              item =>
                String(
                  item.id
                ) ===
                String(postId)
            );

          if (post) {
            openProfileFromUser(
              post.user_id
            );
          }

          return;
        }

        if (
          action.dataset
            .menuAction ===
          "report"
        ) {
          closePostMenu();

          showToast(
            "Report submitted for review."
          );
        }
      }
    );

  document
    .querySelectorAll(
      ".modal"
    )
    .forEach(
      modal => {
        modal.addEventListener(
          "click",
          event => {
            if (
              event.target ===
              modal
            ) {
              modal.classList.remove(
                "open"
              );
            }
          }
        );
      }
    );

  document.addEventListener(
    "keydown",
    event => {
      if (
        event.key ===
        "Escape"
      ) {
        document
          .querySelectorAll(
            ".modal.open"
          )
          .forEach(
            modal =>
              modal.classList.remove(
                "open"
              )
          );

        closePostMenu();
      }

   if (
        $("storyViewer")
          ?.classList.contains(
            "open"
          )
      ) {
        if (
          event.key ===
          "ArrowRight"
        ) {
          nextStory();
        }

        if (
          event.key ===
          "ArrowLeft"
        ) {
          previousStory();
        }
      }
    }
  );

  window.addEventListener(
    "storage",
    event => {
      if (
        event.key ===
        ARS_WHEEL_STORAGE_KEY
      ) {
        const stored =
          getWheelStorage();

        state.wheelSpins =
          stored.spins;

        renderWheel();
      }
    }
  );
}

function initializeWheelStorage() {
  const stored =
    getWheelStorage();

  state.wheelSpins =
    stored.spins;
}

function initialize() {
  initializeWheelStorage();

  bindEvents();

  refreshIcons();

  loadAll();
}

if (
  document.readyState ===
  "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",
    initialize,
    {
      once: true
    }
  );
} else {
  initialize();
}

window.ARSHome = {
  state,

  load: loadAll,

  renderAll,

  renderStories,

  renderPosts,

  renderTrending,

  renderStreak,

  renderProfile,

  showPage,

  openPostComposer,

  openStoryEditor,

  openStoryGroup,

  performSearch,

  refresh: loadAll
};

window.addEventListener(
  "ars:post-created",
  () => {
    loadAll();
  }
);

window.addEventListener(
  "ars:story-created",
  () => {
    loadAll();
  }
);   
