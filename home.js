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

                  <b>
                    ${index + 1}
                  </b>

                  <div>

                    <strong>
                      #${esc(tag)}
                    </strong>

                    <span>
                      ${fmt(count)}
                      post${count === 1 ? "" : "s"}
                    </span>

                  </div>

                  <i data-lucide="chevron-right"></i>

                </button>
              `
          )
          .join("")
      : `
        <div class="empty-state">

          <i data-lucide="flame"></i>

          <h2>
            No trends yet
          </h2>

          <p>
            Use hashtags in posts
            to create trends.
          </p>

        </div>
      `;

  refreshIcons();
}

function showPage(id) {
  document
    .querySelectorAll(".page")
    .forEach(page => {
      page.classList.toggle(
        "active",
        page.id === id
      );
    });

  document
    .querySelectorAll(".nav-item")
    .forEach(item => {
      item.classList.toggle(
        "active",
        item.dataset.page === id
      );
    });

  currentPage = id;

  if (id === "trendingPage") {
    renderTrending();
  }

  if (id === "profilePage") {
    renderProfile();
  }

  if (id === "streakPage") {
    renderStreak();
  }

  if (id === "wheelPage") {
    renderWheel();
  }
}

function openComments(postId) {
  const post = findPost(postId);

  if (!post) {
    return;
  }

  currentCommentPost = post;

  const list = $("commentsList");

  if (!list) {
    return;
  }

  if (post.comments_data.length) {
    list.innerHTML =
      post.comments_data
        .map(
          comment => `
            <article class="comment-item">

              <div class="avatar small">
                ${avatarMarkup(
                  comment,
                  "avatar"
                )}
              </div>

              <div class="comment-content">

                <div class="comment-meta">

                  <strong>
                    ${esc(
                      comment.display_name
                    )}
                  </strong>

                  <span>
                    @${esc(
                      comment.username
                    )}
                  </span>

                </div>

                <p>
                  ${richText(
                    comment.text
                  )}
                </p>

              </div>

            </article>
          `
        )
        .join("");
  } else {
    list.innerHTML = `
      <div class="empty-state compact">

        <i data-lucide="message-circle"></i>

        <h2>
          No comments yet
        </h2>

        <p>
          Be the first to comment.
        </p>

      </div>
    `;
  }

  $("commentsModal").classList.add("open");

  refreshIcons();

  setTimeout(
    () => $("commentInput")?.focus(),
    100
  );
}

function closeComments() {
  $("commentsModal")?.classList.remove("open");

  currentCommentPost = null;
}

async function sendComment() {
  if (!currentCommentPost) {
    return;
  }

  const input = $("commentInput");

  const text = input?.value.trim() || "";

  if (!text) {
    toast("Write a comment first.");
    return;
  }

  try {
    const result = await supabaseClient
      .from("comments")
      .insert({
        post_id: currentCommentPost.id,
        user_id: currentUser.id,
        content: text
      });

    if (result.error) {
      throw result.error;
    }

    const postId = currentCommentPost.id;

    if (input) {
      input.value = "";
    }

    await loadData();

    renderPosts();
    renderProfilePosts();
    renderTrending();

    openComments(postId);

    toast("Comment added.");
  } catch (error) {
    console.error(error);

    toast(
      error.message ||
      "Unable to add comment."
    );
  }
}

function increasePostView(postId) {
  const key = `ars_viewed_${postId}`;

  if (sessionStorage.getItem(key)) {
    return;
  }

  sessionStorage.setItem(key, "1");

  const post = findPost(postId);

  if (!post) {
    return;
  }

  post.views =
    Number(post.views || 0) + 1;

  renderPosts();
}

function openCreatePost() {
  $("createPostModal")?.classList.add("open");

  $("createPostText")?.focus();
}

function closeCreatePost() {
  $("createPostModal")?.classList.remove("open");
}

function openCreateStory() {
  $("createStoryModal")?.classList.add("open");

  resetStoryEditor();
}

function closeCreateStory() {
  $("createStoryModal")?.classList.remove("open");
}

function resetStoryEditor() {
  const file = $("storyImage");

  if (file) {
    file.value = "";
  }

  const image = $("storyImagePreview");

  if (image) {
    image.removeAttribute("src");
    image.style.display = "none";
  }

  const empty = $("storyCanvasEmpty");

  if (empty) {
    empty.style.display = "flex";
  }

  const text = $("storyText");

  if (text) {
    text.value = "";
  }

  const preview = $("storyTextPreview");

  if (preview) {
    preview.textContent = "";
  }
}

function updateStoryPreview() {
  const image = $("storyImagePreview");

  const empty = $("storyCanvasEmpty");

  const text = $("storyText")?.value || "";

  const preview = $("storyTextPreview");

  if (image?.src) {
    image.style.display = "block";

    if (empty) {
      empty.style.display = "none";
    }
  }

  if (preview) {
    preview.textContent = text;

    preview.style.color =
      $("storyTextColor")?.value ||
      "#fff";

    preview.style.top =
      $("storyPosition")?.value === "top"
        ? "12%"
        : $("storyPosition")?.value === "bottom"
          ? "82%"
          : "50%";

    preview.style.transform =
      "translateY(-50%)";
  }
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result);
    };

    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}

function composeStoryImage(
  file,
  text,
  position,
  color
) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => {
        const canvas =
          document.createElement("canvas");

        canvas.width = 1080;
        canvas.height = 1920;

        const context =
          canvas.getContext("2d");

        const scale = Math.max(
          canvas.width / image.width,
          canvas.height / image.height
        );

        const width =
          image.width * scale;

        const height =
          image.height * scale;

        context.drawImage(
          image,
          (canvas.width - width) / 2,
          (canvas.height - height) / 2,
          width,
          height
        );

        if (text) {
          context.fillStyle =
            color || "#ffffff";

          context.textAlign = "center";

          context.textBaseline = "middle";

          context.font =
            "700 68px system-ui,-apple-system,Segoe UI,sans-serif";

          const maxWidth = 900;

          const words = text.split(/\s+/);

          const lines = [];

          let line = "";

          words.forEach(word => {
            const test =
              line
                ? `${line} ${word}`
                : word;

            if (
              context.measureText(test).width >
                maxWidth &&
              line
            ) {
              lines.push(line);

              line = word;
            } else {
              line = test;
            }
          });

          if (line) {
            lines.push(line);
          }

          const y =
            position === "top"
              ? 260
              : position === "bottom"
                ? 1660
                : 960;

          const lineHeight = 86;

          const start =
            y -
            ((lines.length - 1) *
              lineHeight) /
              2;

          lines.forEach(
            (currentLine, index) => {
              context.fillText(
                currentLine,
                canvas.width / 2,
                start +
                  index * lineHeight
              );
            }
          );
        }

        resolve(
          canvas.toDataURL(
            "image/jpeg",
            0.88
          )
        );
      };

      image.onerror = reject;

      image.src = reader.result;
    };

    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}

function openStoryViewer(story) {
  if (!story?.image) {
    openCreateStory();
    return;
  }

  currentStory = story;

  $("storyViewerMedia").innerHTML = `
    <img
      src="${esc(story.image)}"
      alt=""
    >
  `;

  $("storyViewerText").textContent = "";

  $("storyViewerUser").textContent =
    story.display_name || "";

  $("storyViewer").classList.add("open");

  refreshIcons();

  if (currentUser.id && story.id) {
    supabaseClient
      .from("story_views")
      .insert({
        story_id: story.id,
        viewer_id: currentUser.id
      })
      .then(() => {});
  }
}

function closeStoryViewer() {
  $("storyViewer")?.classList.remove("open");

  currentStory = null;
}

function openStoryGroup(userId) {
  const group = stories.filter(
    story =>
      String(story.user_id) ===
      String(userId)
  );

  if (group[0]) {
    openStoryViewer(group[0]);
    return;
  }

  openCreateStory();
}

async function publishStory() {
  const file =
    $("storyImage")?.files?.[0];

  if (!file) {
    toast("Choose a photo first.");
    return;
  }

  if (!file.type.startsWith("image/")) {
    toast("Please choose an image.");
    return;
  }

  try {
    const position =
      $("storyPosition")?.value ||
      "center";

    const text =
      $("storyText")?.value.trim() ||
      "";

    const color =
      $("storyTextColor")?.value ||
      "#ffffff";

    const image =
      await composeStoryImage(
        file,
        text,
        position,
        color
      );

    const result =
      await supabaseClient
        .from("stories")
        .insert({
          user_id: currentUser.id,
          image,
          expires_at:
            new Date(
              Date.now() +
                86400000
            ).toISOString()
        });

    if (result.error) {
      throw result.error;
    }

    closeCreateStory();

    await loadData();

    renderStories();

    toast("Story shared.");
  } catch (error) {
    console.error(error);

    toast(
      error.message ||
      "Unable to create story."
    );
  }
}

async function publishPost() {
  const text =
    $("createPostText")?.value.trim() ||
    "";

  const file =
    $("createPostImage")?.files?.[0];

  if (!text && !file) {
    toast(
      "Write something or add an image."
    );

    return;
  }

  if (
    file &&
    !file.type.startsWith("image/")
  ) {
    toast("Please choose an image.");
    return;
  }

  try {
    const image = file
      ? await readFileAsDataURL(file)
      : null;

    const result =
      await supabaseClient
        .from("posts")
        .insert({
          user_id: currentUser.id,
          content: text,
          image
        });

    if (result.error) {
      throw result.error;
    }

    $("createPostText").value = "";

    $("createPostImage").value = "";

    $("postImagePreview").innerHTML = "";

    closeCreatePost();

    await loadData();

    renderPosts();
    renderProfilePosts();
    renderTrending();

    toast("Post published.");
  } catch (error) {
    console.error(error);

    toast(
      error.message ||
      "Unable to publish post."
    );
  }
}

function runSearch(value) {
  const query =
    String(value || "")
      .trim()
      .toLowerCase();

  const results =
    $("searchResults");

  const home =
    $("searchHome");

  if (!query) {
    results.innerHTML = "";

    if (home) {
      home.style.display = "";
    }

    refreshIcons();

    return;
  }

  if (home) {
    home.style.display = "none";
  }

  const matches =
    posts.filter(post => {
      const source =
        `${post.text} ${
          post.display_name
        } ${
          post.username
        } ${
          (
            post.hashtags ||
            []
          ).join(" ")
        }`.toLowerCase();

      return source.includes(query);
    });

  if (!matches.length) {
    results.innerHTML = `
      <div class="empty-state">

        <i data-lucide="search-x"></i>

        <h2>
          No results
        </h2>

        <p>
          Nothing matched
          "${esc(value)}".
        </p>

      </div>
    `;
  } else {
    results.innerHTML = "";

    renderPosts(
      matches,
      results
    );
  }

  refreshIcons();
}

function renderStreak() {
  const state =
    JSON.parse(
      localStorage.getItem(
        KEYS.streak
      ) || "{}"
    );

  const streak =
    Number(
      state.streak ||
      currentUser.streak ||
      0
    );

  $("streakNumber")
    .textContent =
    String(streak);

  $("streakText")
    .textContent =
    "day streak";

  $("weekDots")
    .innerHTML =
    Array.from(
      {
        length: 7
      },
      (_, index) => `
        <span
          class="${
            index < streak
              ? "active"
              : ""
          }"
        >
          ${
            index < streak
              ? "✓"
              : ""
          }
        </span>
      `
    )
    .join("");

  $("streakDone")
    .textContent =
    streak
      ? "Keep the streak alive."
      : "Complete an activity to start your streak.";
}

function renderWheel() {
  const plan =
    currentUser.plan ||
    "free";

  $("planLabel")
    .textContent =
    plan === "premium"
      ? "Premium"
      : "Free";

  const state =
    JSON.parse(
      localStorage.getItem(
        KEYS.wheel
      ) || "{}"
    );

  $("spinCounter")
    .textContent =
    `${Number(
      state.spins || 0
    )} spins`;
}

function bindEvents() {
  document
    .querySelectorAll(".nav-item")
    .forEach(button => {
      button.addEventListener(
        "click",
        () =>
          showPage(
            button.dataset.page
          )
      );
    });

  $("profileButton")
    ?.addEventListener(
      "click",
      () =>
        showPage("profilePage")
    );

  $("wheelButton")
    ?.addEventListener(
      "click",
      () =>
        showPage("wheelPage")
    );

  $("createPost")
    ?.addEventListener(
      "click",
      openCreatePost
    );

  $("createPostClose")
    ?.addEventListener(
      "click",
      closeCreatePost
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
      async event => {
        const file =
          event.target.files?.[0];

        if (!file) {
          return;
        }

        const image =
          await readFileAsDataURL(
            file
          );

        $("postImagePreview")
          .innerHTML = `
            <div class="preview-wrap">

              <img
                src="${esc(image)}"
                alt=""
              >

              <button
                class="remove-media"
                type="button"
                data-remove-post-image
              >
                <i data-lucide="x"></i>
              </button>

            </div>
          `;

        refreshIcons();
      }
    );

  $("createStoryClose")
    ?.addEventListener(
      "click",
      closeCreateStory
    );

  $("publishStory")
    ?.addEventListener(
      "click",
      publishStory
    );

  $("pickStoryImage")
    ?.addEventListener(
      "click",
      () =>
        $("storyImage")?.click()
    );

  $("storyImage")
    ?.addEventListener(
      "change",
      async event => {
        const file =
          event.target.files?.[0];

        if (!file) {
          return;
        }

        $("storyImagePreview")
          .src =
          await readFileAsDataURL(
            file
          );

        updateStoryPreview();
      }
    );

  $("storyText")
    ?.addEventListener(
      "input",
      updateStoryPreview
    );

  $("storyPosition")
    ?.addEventListener(
      "change",
      updateStoryPreview
    );

  $("storyTextColor")
    ?.addEventListener(
      "input",
      updateStoryPreview
    );

  $("storyViewerClose")
    ?.addEventListener(
      "click",
      closeStoryViewer
    );

  $("commentsClose")
    ?.addEventListener(
      "click",
      closeComments
    );

  $("sendComment")
    ?.addEventListener(
      "click",
      sendComment
    );

  $("searchInput")
    ?.addEventListener(
      "input",
      event =>
        runSearch(
          event.target.value
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
      () => {
        const state =
          JSON.parse(
            localStorage.getItem(
              KEYS.wheel
            ) || "{}"
          );

        state.spins =
          Number(
            state.spins || 0
          ) + 1;

        localStorage.setItem(
          KEYS.wheel,
          JSON.stringify(state)
        );

        wheelRotation +=
          360 +
          Math.floor(
            Math.random() * 360
          );

        $("wheel").style.transform =
          `rotate(${wheelRotation}deg)`;

        renderWheel();

        $("challengeResult")
          .textContent =
          "Challenge unlocked. Keep going.";
      }
    );

  document.addEventListener(
    "click",
    async event => {
      const action =
        event.target.closest(
          "[data-action]"
        );

      if (action) {
        await postAction(
          action.dataset.action,
          action.dataset.id
        );

        return;
      }

      const story =
        event.target.closest(
          "[data-story-group]"
        );

      if (story) {
        openStoryGroup(
          story.dataset.storyGroup
        );

        return;
      }

      const tag =
        event.target.closest(
          "[data-hashtag],[data-trending-tag]"
        );

      if (tag) {
        const value =
          tag.dataset.hashtag ||
          tag.dataset.trendingTag;

        showPage("searchPage");

        $("searchInput").value =
          `#${value}`;

        runSearch(
          `#${value}`
        );

        return;
      }

      if (
        event.target.closest(
          "[data-remove-post-image]"
        )
      ) {
        $("postImagePreview")
          .innerHTML = "";

        $("createPostImage")
          .value = "";
      }
    }
  );

  document.addEventListener(
    "keydown",
    event => {
      if (
        event.key !== "Escape"
      ) {
        return;
      }

      closeComments();
      closeCreatePost();
      closeCreateStory();
      closeStoryViewer();
    }
  );
}

async function init() {
  if (initialized) {
    return;
  }

  initialized = true;

  const loaded =
    await loadData();

  if (!loaded) {
    return;
  }

  renderTopAvatar();
  renderProfile();
  renderStories();
  renderPosts();
  renderTrending();
  renderStreak();
  renderWheel();

  bindEvents();

  refreshIcons();
}

window.ARSHome = {
  getPosts: () =>
    posts,

  getStories: () =>
    stories,

  refresh: async () => {
    await loadData();

    renderTopAvatar();
    renderStories();
    renderPosts();
    renderTrending();
    renderProfile();
    renderStreak();
    renderWheel();

    refreshIcons();
  },

  openCreatePost,

  openCreateStory,

  openStreak: () =>
    showPage("streakPage"),

  openWheel: () =>
    showPage("wheelPage"),

  search: runSearch
};

if (
  document.readyState ===
  "loading"
) {
  document.addEventListener(
    DOMContentLoaded,
    init,
    {
      once: true
    }
  );
} else {
  init();
}

window.ARSHome = {
  getPosts: () => posts,

  getStories: () => stories,

  refresh: async () => {
    await loadData();

    renderTopAvatar();
    renderStories();
    renderPosts();
    renderTrending();
    renderProfile();
    renderStreak();
    renderWheel();

    refreshIcons();
  },

  openCreatePost,

  openCreateStory,

  openStreak: () =>
    showPage("streakPage"),

  openWheel: () =>
    showPage("wheelPage"),

  search: runSearch
};
