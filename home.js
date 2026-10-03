const SUPABASE_URL = "https://bfqsqgfyyewnfxekirfv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_OM-LGm9LZCtmzkGYmpyA8A_jnvgmH1-";

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
  storyImageData: null,
  currentStoryGroup: [],
  currentStoryIndex: 0,
  currentPostId: null,
  wheelRotation: 0,
  initialized: false,
  loading: false
};

const escapeHtml = (value) =>
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

const formatCount = (value) => {
  const number = Number(value || 0);

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

const timeAgo = (value) => {
  if (!value) {
    return "";
  }

  const seconds = Math.max(
    0,
    Math.floor(
      (Date.now() -
        new Date(value).getTime()) /
        1000
    )
  );

  if (seconds < 60) {
    return `${seconds}s`;
  }

  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m`;
  }

  if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)}h`;
  }

  return `${Math.floor(seconds / 86400)}d`;
};

const refreshIcons = () =>
  window.lucide?.createIcons?.();

function showToast(message) {
  const element = $("toast");

  if (!element) {
    return;
  }

  element.textContent = message;
  element.classList.add("show");

  clearTimeout(
    window.__arsToastTimer
  );

  window.__arsToastTimer = setTimeout(
    () =>
      element.classList.remove(
        "show"
      ),
    2200
  );
}

function localProfileSettings() {
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
    localProfileSettings();

  const avatar =
    typeof user.avatar === "string"
      ? user.avatar
      : "";

  const image =
    /^(https?:|data:image|blob:)/i.test(
      avatar
    );

  if (image) {
    return `
      <div class="${className}">
        <img
          src="${escapeHtml(
            avatar
          )}"
          alt=""
        >
      </div>
    `;
  }

  const letter = String(
    user.letter ||
      settings.letter ||
      user.display_name ||
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
      class="${className}"
      style="--avatar:${escapeHtml(
        color
      )}"
    >
      <span>
        ${escapeHtml(letter)}
      </span>
    </div>
  `;
}

function normalizeUser(
  user = {}
) {
  const settings =
    localProfileSettings();

  return {
    id: user.id || "",

    username:
      user.username || "you",

    display_name:
      user.display_name || "You",

    email:
      user.email || "",

    bio:
      user.bio || "",

    avatar:
      user.avatar || "",

    verified:
      Boolean(user.verified),

    plan:
      user.plan || "free",

    streak:
      Number(user.streak || 0),

    xp:
      Number(user.xp || 0),

    letter:
      settings.letter,

    letterColor:
      settings.letterColor
  };
}

function normalizePost(
  row = {}
) {
  const user =
    row.users ||
    row.user ||
    {};

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
        row.likes_count ||
          row.likes ||
          0
      ),

    comments_count:
      Number(
        row.comments_count ||
          row.comments ||
          0
      ),

    reposts_count:
      Number(
        row.reposts_count ||
          row.reposts ||
          0
      ),

    views_count:
      Number(
        row.views_count ||
          row.views ||
          0
      ),

    liked:
      Boolean(row.liked),

    reposted:
      Boolean(row.reposted),

    bookmarked:
      Boolean(row.bookmarked),

    user:
      normalizeUser(user)
  };
}

function normalizeStory(
  row = {}
) {
  return {
    id: row.id,

    user_id:
      row.user_id,

    image:
      row.image || "",

    created_at:
      row.created_at,

    expires_at:
      row.expires_at,

    viewers_count:
      Number(
        row.viewers_count || 0
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
    ...String(text || "").matchAll(
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

  if (
    error ||
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
      .eq("id", authUser.id)
      .maybeSingle();

  if (error) {
    throw error;
  }

  const user =
    normalizeUser(
      data || {
        id: authUser.id,

        email:
          authUser.email || "",

        username:
          authUser
            .user_metadata
            ?.username ||
          "you",

        display_name:
          authUser
            .user_metadata
            ?.display_name ||
          "You"
      }
    );

  localStorage.setItem(
    "ars_user",
    JSON.stringify(user)
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
      (post) => post.id
    );

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
      (likes.data || []).map(
        (row) =>
          String(row.post_id)
      )
    );

  const reposted =
    new Set(
      (reposts.data || []).map(
        (row) =>
          String(row.post_id)
      )
    );

  const bookmarked =
    new Set(
      (bookmarks.data || []).map(
        (row) =>
          String(row.post_id)
      )
    );
    state.posts.forEach(
    (post) => {
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
  state.loading = true;

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
    console.error(
      "ARS load error:",
      error
    );

    showToast(
      error.message ||
        "Unable to load ARS."
    );

  } finally {
    state.loading = false;
  }
}

function updateUserUI() {
  const avatar =
    $("profileButton");

  if (avatar) {
    avatar.innerHTML =
      avatarMarkup(
        state.user,
        "avatar"
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
      if (!story.user_id) {
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
        .get(story.user_id)
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
      a === state.user?.id
        ? -1
        : b === state.user?.id
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
              userId ===
              state.user?.id
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

              ${avatarMarkup(
                user,
                "story-avatar"
              )}

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

function postMarkup(post) {
  return `
    <article
      class="post-card"
      data-post-id="${escapeHtml(
        post.id
      )}"
    >

      <div class="post-head">

        ${avatarMarkup(
          post.user,
          "post-avatar"
        )}

        <div class="post-user">

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
            ${timeAgo(
              post.created_at
            )}
          </span>

        </div>

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
        .map(postMarkup)
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
            state.user.display_name
          )}
        </h1>

        <p>
          @${escapeHtml(
            state.user.username
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

function renderTrending() {
  const target =
    $("trendingList");

  if (!target) {
    return;
  }

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
            (counts.get(tag) ||
              0) + 1
          );
        }
      );
    }
  );

  const rows =
    [...counts.entries()]
      .sort(
        (a, b) =>
          b[1] - a[1]
      )
      .slice(0, 20);

  target.innerHTML =
    rows.length
      ? rows
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
          .join("")
      : `
        <div class="empty-state compact">

          <i data-lucide="flame"></i>

          <h2>No trends yet</h2>

          <p>
            Hashtags will appear here when people start posting.
          </p>

        </div>
      `;

  refreshIcons();
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

  const people =
    state.posts
      .map(
        (post) =>
          post.user
      )
      .filter(
        (user, index, array) =>
          array.findIndex(
            (item) =>
              item.id ===
              user.id
          ) === index
      )
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
    state.posts.filter(
      (post) =>
        hashtagsFromText(
          post.content
        ).some(
          (tag) =>
            `#${tag}`.includes(
              value
            )
        )
    );

  const html = [];

  people
    .slice(0, 10)
    .forEach(
      (user) => {
        html.push(`
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
        `);
      }
    );

  matchingPosts
    .slice(0, 10)
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
                  post.user.display_name
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

  matchingTags
    .slice(0, 10)
    .forEach(
      (post) => {
        hashtagsFromText(
          post.content
        )
          .filter(
            (tag) =>
              `#${tag}`.includes(
                value
              )
          )
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

  if ($("composeAvatar")) {
    $("composeAvatar")
      .innerHTML =
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

function openStoryEditor() {
  state.storyImageData =
    null;

  const input =
    $("storyImage");

  const text =
    $("storyText");

  const preview =
    $("storyImagePreview");

  const empty =
    $("storyCanvasEmpty");

  const textPreview =
    $("storyTextPreview");

  if (input) {
    input.value = "";
  }

  if (text) {
    text.value = "";
  }

  if (preview) {
    preview.removeAttribute(
      "src"
    );

    preview.style.display =
      "none";
  }

  if (empty) {
    empty.style.display =
      "flex";
  }

  if (textPreview) {
    textPreview.textContent =
      "";
  }

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
    const image =
      state.postImageData ||
      null;

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

          image
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
      normalizePost(data)
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
    console.error(error);

    showToast(
      error.message ||
        "Unable to publish post."
    );
  }
}

function createStoryCanvas(
  dataUrl,
  text,
  position,
  textColor
) {
  return new Promise(
    (resolve) => {
      const canvas =
        document.createElement(
          "canvas"
        );

      canvas.width =
        1080;

      canvas.height =
        1920;

      const ctx =
        canvas.getContext(
          "2d"
        );

      const drawText =
        () => {
          if (text) {
            ctx.fillStyle =
              textColor ||
              "#ffffff";

            ctx.font =
              "700 76px Inter, Arial, sans-serif";

            ctx.textAlign =
              "center";

            ctx.textBaseline =
              position ===
              "top"
                ? "top"
                : position ===
                    "bottom"
                  ? "bottom"
                  : "middle";

            const y =
              position ===
              "top"
                ? 120
                : position ===
                    "bottom"
                  ? 1800
                  : 960;

            ctx.shadowColor =
              "rgba(0,0,0,.7)";

            ctx.shadowBlur =
              16;

            ctx.fillText(
              text,
              540,
              y,
              900
            );
          }

          resolve(
            canvas.toDataURL(
              "image/jpeg",
              0.9
            )
          );
        };

      ctx.fillStyle =
        "#12091a";

      ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
      );

      if (dataUrl) {
        const image =
          new Image();

        image.onload =
          () => {
            const scale =
              Math.max(
                canvas.width /
                  image.width,

                canvas.height /
                  image.height
              );

            const width =
              image.width *
              scale;

            const height =
              image.height *
              scale;

            ctx.drawImage(
              image,

              (
                canvas.width -
                width
              ) / 2,

              (
                canvas.height -
                height
              ) / 2,

              width,
              height
            );

            drawText();
          };

        image.src =
          dataUrl;
      } else {
        drawText();
      }
    }
  );
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
    !state.storyImageData &&
    !text
  ) {
    showToast(
      "Add a photo or text first."
    );

    return;
  }

  try {
    const rendered =
      await createStoryCanvas(
        state.storyImageData,
        text,
        $("storyPosition")
          ?.value ||
          "center",
        $("storyTextColor")
          ?.value ||
          "#ffffff"
      );

    const expires =
      new Date(
        Date.now() +
          24 *
            60 *
            60 *
            1000
      ).toISOString();

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
            rendered,

          expires_at:
            expires
        })
        .select(`
          id,
          created_at,
          user_id,
          image,
          viewers_count,
          expires_at,
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
      normalizeStory(data)
    );

    closeModal(
      "createStoryModal"
    );

    renderStories();

    showToast(
      "Story published."
    );

  } catch (error) {
    console.error(error);

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
    incrementViews(
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
    console.error(error);

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
    !post ||
    !post.id
  ) {
    return;
  }

  post.views_count += 1;

  renderPosts();

  const {
    error
  } =
    await supabaseClient
      .from("posts")
      .update({
        views_count:
          post.views_count
      })
      .eq(
        "id",
        post.id
      );

  if (error) {
    console.error(
      "View update failed:",
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
          verified
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
    console.error(error);

    list.innerHTML = `
      <div class="comments-empty">
        Unable to load comments.
      </div>
    `;

    return;
  }

  state.comments.set(
    String(postId),
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
      .map(
        (comment) => {
          const user =
            normalizeUser(
              comment.users ||
                {}
            );

          return `
            <article class="comment">

              <strong>
                ${escapeHtml(
                  user.display_name
                )}
              </strong>

              <span>
                @${escapeHtml(
                  user.username
                )}
                ·
                ${timeAgo(
                  comment.created_at
                )}
              </span>

              <p>
                ${escapeHtml(
                  comment.content ||
                    ""
                )}
              </p>

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
    console.error(error);

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
        String(userId)
    );

  if (!group.length) {
    openStoryEditor();

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
      story.image
        ? `
          <img
            src="${escapeHtml(
              story.image
            )}"
            alt=""
          >
        `
        : "";
  }

  if (text) {
    text.textContent =
      "";
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
            story.user
              .username
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

  if (!error) {
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
}

function nextStory() {
  if (
    state.currentStoryIndex >=
    state.currentStoryGroup.length -
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

function bindEvents() {
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

  $("storyViewerClose")
    ?.addEventListener(
      "click",
      () =>
        closeModal(
          "storyViewer"
        )
    );

  $("storyViewerMedia")
    ?.addEventListener(
      "click",
      nextStory
    );

  $("pickPostImage")
    ?.addEventListener(
      "click",
      () =>
        $("createPostImage")
          ?.click()
    );

  $("pickStoryImage")
    ?.addEventListener(
      "click",
      () =>
        $("storyImage")
          ?.click()
    );

  $("createPostImage")
    ?.addEventListener(
      "change",
      async (event) => {
        const file =
          event.target
            .files?.[0];

        if (!file) {
          return;
        }

        state.postImageData =
          await readFileAsDataUrl(
            file
          );

        $("postImagePreview")
          .innerHTML = `
            <div class="preview-wrap">

              <img
                src="${escapeHtml(
                  state.postImageData
                )}"
                alt=""
              >

            </div>
          `;
      }
    );

  $("storyImage")
    ?.addEventListener(
      "change",
      async (event) => {
        const file =
          event.target
            .files?.[0];

        if (!file) {
          return;
        }

        state.storyImageData =
          await readFileAsDataUrl(
            file
          );

        const preview =
          $("storyImagePreview");

        const empty =
          $("storyCanvasEmpty");

        if (preview) {
          preview.src =
            state.storyImageData;

          preview.style.display =
            "block";
        }

        if (empty) {
          empty.style.display =
            "none";
        }
      }
    );

  $("storyText")
    ?.addEventListener(
      "input",
      (event) => {
        const preview =
          $("storyTextPreview");

        if (preview) {
          preview.textContent =
            event.target.value;
        }
      }
    );

  $("storyPosition")
    ?.addEventListener(
      "change",
      (event) => {
        const text =
          $("storyTextPreview");

        if (!text) {
          return;
        }

        text.style.top =
          event.target.value ===
          "top"
            ? "20%"
            : event.target
                  .value ===
                "bottom"
              ? "75%"
              : "45%";
      }
    );

  $("storyTextColor")
    ?.addEventListener(
      "input",
      (event) => {
        const text =
          $("storyTextPreview");

        if (text) {
          text.style.color =
            event.target.value;
        }
      }
    );

  $("searchInput")
    ?.addEventListener(
      "input",
      (event) => {
        state.searchQuery =
          event.target.value;

        performSearch(
          state.searchQuery
        );
      }
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

  document
    .querySelectorAll(
      ".nav-item[data-page]"
    )
    .forEach(
      (button) =>
        button.addEventListener(
          "click",
          () =>
            showPage(
              button.dataset.page
            )
        )
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
    event.target.closest?.(
      "[data-story-user]"
    );

  if (storyButton) {
    event.preventDefault();

    openStoryGroup(
      storyButton.dataset
        .storyUser
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

    state.searchQuery =
      `#${hashtag.dataset.hashtag}`;

    showPage(
      "searchPage"
    );

    if ($("searchInput")) {
      $("searchInput").value =
        state.searchQuery;
    }

    performSearch(
      state.searchQuery
    );

    return;
  }

  const trend =
    event.target.closest?.(
      "[data-trending-tag]"
    );

  if (trend) {
    state.searchQuery =
      `#${trend.dataset.trendingTag}`;

    showPage(
      "searchPage"
    );

    if ($("searchInput")) {
      $("searchInput").value =
        state.searchQuery;
    }

    performSearch(
      state.searchQuery
    );
  }
}

async function spinWheel() {
  const wheel =
    $("wheel");

  if (!wheel) {
    return;
  }

  state.wheelRotation +=
    1440 +
    Math.floor(
      Math.random() *
        360
    );

  wheel.style.transform =
    `rotate(${state.wheelRotation}deg)`;

  const challenges = [
    "Post something today",
    "Share a story",
    "Like three posts",
    "Use a hashtag",
    "Leave a comment"
  ];

  const result =
    challenges[
      Math.floor(
        Math.random() *
          challenges.length
      )
    ];

  setTimeout(
    () => {
      const target =
        $("challengeResult");

      if (target) {
        target.textContent =
          result;
      }
    },
    1200
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
}

function renderWheel() {
  if ($("spinCounter")) {
    $("spinCounter")
      .textContent =
      "0 spins";
  }

  if ($("planLabel")) {
    $("planLabel")
      .textContent =
      state.user?.plan ===
      "premium"
        ? "Premium"
        : "Free";
  }
}

function renderAll() {
  renderStories();
  renderPosts();
  renderTrending();
  renderStreak();
  renderWheel();
}

async function init() {
  if (state.initialized) {
    return;
  }

  state.initialized =
    true;

  refreshIcons();

  bindEvents();

  await loadAll();
}

document.addEventListener(
  "DOMContentLoaded",
  init
);
  
