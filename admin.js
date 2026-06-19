const defaults = {
  profile: {
    name: "Mi Portfolio",
    headline: "Tecnología, análisis y creatividad",
    profession: "",
    location: "Perú",
    avatar_url: "",
    email: "",
    phone: "",
    linkedin: "",
    github: "",
    about: "",
    focus: ""
  },

  highlights: [],
  experience: [],
  projects: [],
  photos: [],
  social_links: []
};

let supabaseClient = null;

let state = {
  profile: defaults.profile,
  highlights: [],
  experience: [],
  projects: [],
  photos: [],
  social_links: []
};

const hasSupabaseConfig = () =>
  Boolean(
    window.SUPABASE_CONFIG?.url &&
    window.SUPABASE_CONFIG?.anonKey
  );

const localGet = (key, fallback) => {
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : fallback;
};

const localSet = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const nextId = items =>
  Math.max(
    0,
    ...items.map(item => Number(item.id) || 0)
  ) + 1;

function setupClient() {

  if (supabaseClient) {
    return supabaseClient;
  }

  if (!hasSupabaseConfig()) {
    return null;
  }

  supabaseClient =
    window.supabase.createClient(
      window.SUPABASE_CONFIG.url,
      window.SUPABASE_CONFIG.anonKey
    );

  return supabaseClient;

}
async function loadState() {

  if (!supabaseClient) {

    supabaseClient =
      setupClient();

  }

  document.querySelector("#admin-content").hidden = false;
  document.querySelector("#auth-panel").hidden = true;

  document.querySelector("#storage-status").textContent =
    supabaseClient
      ? "Conectado a Supabase."
      : "Modo local.";

  if (!supabaseClient) {

    state = {

      profile:
        localGet(
          "profile",
          defaults.profile
        ),

      highlights:
        localGet(
          "highlights",
          defaults.highlights
        ),

      experience:
        localGet(
          "experience",
          defaults.experience
        ),

      projects:
        localGet(
          "projects",
          defaults.projects
        ),

      photos:
        localGet(
          "photos",
          defaults.photos
        ),

      social_links:
        localGet(
          "social_links",
          defaults.social_links
        )

    };

    renderAll();

    return;

  }

  const {
    data: sessionData
  } =
    await supabaseClient
      .auth
      .getSession();

if (!sessionData.session) {

  console.log(
    "Usuario NO autenticado"
  );

  document.querySelector(
    "#storage-status"
  ).textContent =
    "Inicia sesión para administrar el contenido.";

  document.querySelector(
    "#admin-content"
  ).hidden = true;

  document.querySelector(
    "#auth-panel"
  ).hidden = false;

  return;

}

console.log(
  "Usuario autenticado"
);

document.querySelector(
  "#admin-content"
).hidden = false;

document.querySelector(
  "#auth-panel"
).hidden = true;

  const [

    { data: profile },

    { data: highlights },

    { data: experience },

    { data: projects },

    { data: photos },

    { data: socialLinks }

  ] = await Promise.all([

    supabaseClient
      .from("profile")
      .select("*")
      .eq("id", 1)
      .single(),

    supabaseClient
      .from("highlights")
      .select("*")
      .order("sort_order"),

    supabaseClient
      .from("experience")
      .select("*")
      .order("sort_order"),

    supabaseClient
      .from("projects")
      .select("*")
      .order("sort_order"),

    supabaseClient
      .from("photos")
      .select("*")
      .order("sort_order"),

    supabaseClient
      .from("social_links")
      .select("*")
      .order("sort_order")

  ]);

  state = {

    profile:
      profile ||
      defaults.profile,

    highlights:
      highlights || [],

    experience:
      experience || [],

    projects:
      projects || [],

    photos:
      photos || [],

    social_links:
      socialLinks || []

  };

  renderAll();

}
function fillProfileForm() {

  const form =
    document.querySelector(
      "#profile-form"
    );

  if (!form) return;

  Object.entries(
    state.profile || {}
  ).forEach(([key, value]) => {

    if (form.elements[key]) {

      form.elements[key].value =
        value || "";

    }

  });

}

/* ==========================================
   HIGHLIGHTS
========================================== */

function renderHighlights() {

  const list =
    document.querySelector(
      "#highlight-list"
    );

  if (!list) return;

  list.innerHTML = "";

  if (!state.highlights.length) {

    list.innerHTML = `
      <div class="empty-state">
        No hay especialidades registradas.
      </div>
    `;

    return;

  }

  state.highlights

    .sort(
      (a, b) =>
        Number(a.sort_order || 0) -
        Number(b.sort_order || 0)
    )

    .forEach(item => {

      const row =
        document.createElement(
          "article"
        );

      row.className =
        "manager-item";

      row.innerHTML = `

        <div>

          <h3>
            ${item.title}
          </h3>

          <p>
            ${item.description || ""}
          </p>

          <small>
            Orden:
            ${item.sort_order || 0}
          </small>

        </div>

        <div class="manager-actions">

          <button
            class="small-button"
            data-edit-highlight="${item.id}"
          >
            Editar
          </button>

          <button
            class="small-button delete"
            data-delete-highlight="${item.id}"
          >
            Eliminar
          </button>

        </div>

      `;

      list.append(row);

    });

}

/* ==========================================
   EXPERIENCE
========================================== */

function renderExperience() {

  const list =
    document.querySelector(
      "#experience-list"
    );

  if (!list) return;

  list.innerHTML = "";

  if (!state.experience.length) {

    list.innerHTML = `
      <div class="empty-state">
        No hay experiencia registrada.
      </div>
    `;

    return;

  }

  state.experience

    .sort(
      (a, b) =>
        Number(a.sort_order || 0) -
        Number(b.sort_order || 0)
    )

    .forEach(item => {

      const row =
        document.createElement(
          "article"
        );

      row.className =
        "manager-item";

      row.innerHTML = `

        <div>

          <h3>
            ${item.year}
            —
            ${item.title}
          </h3>

          <p>
            ${item.description || ""}
          </p>

          <small>
            Orden:
            ${item.sort_order || 0}
          </small>

        </div>

        <div class="manager-actions">

          <button
            class="small-button"
            data-edit-experience="${item.id}"
          >
            Editar
          </button>

          <button
            class="small-button delete"
            data-delete-experience="${item.id}"
          >
            Eliminar
          </button>

        </div>

      `;

      list.append(row);

    });

}

/* ==========================================
   PROJECTS
========================================== */

function renderProjects() {

  const list =
    document.querySelector(
      "#project-list"
    );

  if (!list) return;

  list.innerHTML = "";

  if (!state.projects.length) {

    list.innerHTML = `
      <div class="empty-state">
        No hay proyectos registrados.
      </div>
    `;

    return;

  }

  state.projects

    .sort(
      (a, b) =>
        Number(a.sort_order || 0) -
        Number(b.sort_order || 0)
    )

    .forEach(project => {

      const row =
        document.createElement(
          "article"
        );

      row.className =
        "manager-item";

      row.innerHTML = `

        <div>

          ${
            project.image_url
              ? `
                <img
                  src="${project.image_url}"
                  alt="${project.title}"
                >
              `
              : ""
          }

          <h3>
            ${project.title}
          </h3>

          <p>
            ${project.description || ""}
          </p>

          <small>
            Orden:
            ${project.sort_order || 0}
          </small>

        </div>

        <div class="manager-actions">

          <button
            class="small-button"
            data-edit-project="${project.id}"
          >
            Editar
          </button>

          <button
            class="small-button delete"
            data-delete-project="${project.id}"
          >
            Eliminar
          </button>

        </div>

      `;

      list.append(row);

    });

}

/* ==========================================
   PHOTOS
========================================== */

function renderPhotos() {

  const list =
    document.querySelector(
      "#photo-list"
    );

  if (!list) return;

  list.innerHTML = "";

  if (!state.photos.length) {

    list.innerHTML = `
      <div class="empty-state">
        No hay fotografías registradas.
      </div>
    `;

    return;

  }

  state.photos

    .sort(
      (a, b) =>
        Number(a.sort_order || 0) -
        Number(b.sort_order || 0)
    )

    .forEach(photo => {

      const row =
        document.createElement(
          "article"
        );

      row.className =
        "manager-item";

      row.innerHTML = `

        <div>

          ${
            photo.image_url
              ? `
                <img
                  src="${photo.image_url}"
                  alt="${photo.title}"
                >
              `
              : ""
          }

          <h3>
            ${photo.title}
          </h3>

          <p>
            ${photo.location || ""}
          </p>

        </div>

        <div class="manager-actions">

          <button
            class="small-button"
            data-edit-photo="${photo.id}"
          >
            Editar
          </button>

          <button
            class="small-button delete"
            data-delete-photo="${photo.id}"
          >
            Eliminar
          </button>

        </div>

      `;

      list.append(row);

    });

}

/* ==========================================
   SOCIAL LINKS
========================================== */

function renderSocialLinks() {

  const list =
    document.querySelector(
      "#social-list"
    );

  if (!list) return;

  list.innerHTML = "";

  if (!state.social_links.length) {

    list.innerHTML = `
      <div class="empty-state">
        No hay redes configuradas.
      </div>
    `;

    return;

  }

  state.social_links

    .sort(
      (a, b) =>
        Number(a.sort_order || 0) -
        Number(b.sort_order || 0)
    )

    .forEach(item => {

      const row =
        document.createElement(
          "article"
        );

      row.className =
        "manager-item";

      row.innerHTML = `

        <div>

          <h3>
            ${item.platform}
          </h3>

          <p>
            ${item.url}
          </p>

        </div>

        <div class="manager-actions">

          <button
            class="small-button"
            data-edit-social="${item.id}"
          >
            Editar
          </button>

          <button
            class="small-button delete"
            data-delete-social="${item.id}"
          >
            Eliminar
          </button>

        </div>

      `;

      list.append(row);

    });

}

/* ==========================================
   RENDER GENERAL
========================================== */

function renderAll() {

  fillProfileForm();

  renderHighlights();

  renderExperience();

  renderProjects();

  renderPhotos();

  renderSocialLinks();

}
/* ==========================================
   PROFILE
========================================== */

async function saveProfile(profile) {

  if (!supabaseClient) {

    state.profile = profile;

    localSet(
      "profile",
      profile
    );

    return;

  }

  const { error } =
    await supabaseClient

      .from("profile")

      .upsert({

        id: 1,

        ...profile,

        updated_at:
          new Date().toISOString()

      });

  if (error)
    throw error;

  state.profile =
    profile;

}

/* ==========================================
   HIGHLIGHTS
========================================== */

async function saveHighlight(item) {

  if (!supabaseClient) {

    const id =
      item.id
        ? Number(item.id)
        : nextId(
            state.highlights
          );

    const saved = {

      ...item,

      id,

      sort_order:
        Number(
          item.sort_order || 0
        )

    };

    state.highlights =
      state.highlights

        .filter(
          x =>
            Number(x.id) !== id
        )

        .concat(saved);

    localSet(
      "highlights",
      state.highlights
    );

    renderHighlights();

    return;

  }

  const payload = {

    ...item,

    sort_order:
      Number(
        item.sort_order || 0
      )

  };

  if (!payload.id)
    delete payload.id;

  const { error } =
    await supabaseClient

      .from("highlights")

      .upsert(payload);

  if (error)
    throw error;

  await loadState();

}

async function deleteHighlight(id) {

  if (!supabaseClient) {

    state.highlights =
      state.highlights.filter(
        item =>
          Number(item.id) !==
          Number(id)
      );

    localSet(
      "highlights",
      state.highlights
    );

    renderHighlights();

    return;

  }

  const { error } =
    await supabaseClient

      .from("highlights")

      .delete()

      .eq("id", id);

  if (error)
    throw error;

  await loadState();

}

/* ==========================================
   EXPERIENCE
========================================== */

async function saveExperience(item) {

  if (!supabaseClient) {

    const id =
      item.id
        ? Number(item.id)
        : nextId(
            state.experience
          );

    const saved = {

      ...item,

      id,

      sort_order:
        Number(
          item.sort_order || 0
        )

    };

    state.experience =
      state.experience

        .filter(
          x =>
            Number(x.id) !== id
        )

        .concat(saved);

    localSet(
      "experience",
      state.experience
    );

    renderExperience();

    return;

  }

  const payload = {
  year: item.year,
  title: item.title,
  description: item.description,
  sort_order: Number(item.sort_order || 0)
};

if (item.id) {

  const { error } =
    await supabaseClient
      .from("experience")
      .update(payload)
      .eq("id", item.id);

  if (error) throw error;

}

else {

  const { error } =
    await supabaseClient
      .from("experience")
      .insert(payload);

  if (error) throw error;

}

await loadState();

}

async function deleteExperience(id) {

  if (!supabaseClient) {

    state.experience =
      state.experience.filter(
        item =>
          Number(item.id) !==
          Number(id)
      );

    localSet(
      "experience",
      state.experience
    );

    renderExperience();

    return;

  }

  const { error } =
    await supabaseClient

      .from("experience")

      .delete()

      .eq("id", id);

  if (error)
    throw error;

  await loadState();

}

/* ==========================================
   PROJECTS
========================================== */

async function saveProject(item) {

  if (!supabaseClient) {

    const id =
      item.id
        ? Number(item.id)
        : nextId(
            state.projects
          );

    const saved = {

      ...item,

      id,

      sort_order:
        Number(
          item.sort_order || 0
        )

    };

    state.projects =
      state.projects

        .filter(
          x =>
            Number(x.id) !== id
        )

        .concat(saved);

    localSet(
      "projects",
      state.projects
    );

    renderProjects();

    return;

  }

const payload = {
  title: item.title,
  description: item.description,
  image_url: item.image_url,
  project_url: item.project_url,
  technologies: item.technologies,
  sort_order: Number(item.sort_order || 0)
};

if (item.id) {

  const { error } =
    await supabaseClient
      .from("projects")
      .update(payload)
      .eq("id", item.id);

  if (error) throw error;

}

else {

  const { error } =
    await supabaseClient
      .from("projects")
      .insert(payload);

  if (error) throw error;

}

await loadState();
}

async function deleteProject(id) {

  if (!supabaseClient) {

    state.projects =
      state.projects.filter(
        item =>
          Number(item.id) !==
          Number(id)
      );

    localSet(
      "projects",
      state.projects
    );

    renderProjects();

    return;

  }

  const { error } =
    await supabaseClient

      .from("projects")

      .delete()

      .eq("id", id);

  if (error)
    throw error;

  await loadState();

}

/* ==========================================
   PHOTOS
========================================== */

async function savePhoto(item) {

  if (!supabaseClient) {

    const id =
      item.id
        ? Number(item.id)
        : nextId(
            state.photos
          );

    const saved = {

      ...item,

      id,

      sort_order:
        Number(
          item.sort_order || 0
        )

    };

    state.photos =
      state.photos

        .filter(
          x =>
            Number(x.id) !== id
        )

        .concat(saved);

    localSet(
      "photos",
      state.photos
    );

    renderPhotos();

    return;

  }

  const payload = {

    ...item,

    sort_order:
      Number(
        item.sort_order || 0
      )

  };

  if (!payload.id)
    delete payload.id;

  const { error } =
    await supabaseClient

      .from("photos")

      .upsert(payload);

  if (error)
    throw error;

  await loadState();

}

async function deletePhoto(id) {

  if (!supabaseClient) {

    state.photos =
      state.photos.filter(
        item =>
          Number(item.id) !==
          Number(id)
      );

    localSet(
      "photos",
      state.photos
    );

    renderPhotos();

    return;

  }

  const { error } =
    await supabaseClient

      .from("photos")

      .delete()

      .eq("id", id);

  if (error)
    throw error;

  await loadState();

}

/* ==========================================
   SOCIAL LINKS
========================================== */

async function saveSocialLink(item) {

  if (!supabaseClient) {

    const id =
      item.id
        ? Number(item.id)
        : nextId(
            state.social_links
          );

    const saved = {

      ...item,

      id,

      sort_order:
        Number(
          item.sort_order || 0
        )

    };

    state.social_links =
      state.social_links

        .filter(
          x =>
            Number(x.id) !== id
        )

        .concat(saved);

    localSet(
      "social_links",
      state.social_links
    );

    renderSocialLinks();

    return;

  }

  const payload = {
  platform: item.platform,
  url: item.url,
  icon: item.icon,
  sort_order: Number(item.sort_order || 0)
};

if (item.id) {

  const { error } =
    await supabaseClient
      .from("social_links")
      .update(payload)
      .eq("id", item.id);

  if (error) throw error;

}

else {

  const { error } =
    await supabaseClient
      .from("social_links")
      .insert(payload);

  if (error) throw error;

}

await loadState();

}

async function deleteSocialLink(id) {

  if (!supabaseClient) {

    state.social_links =
      state.social_links.filter(
        item =>
          Number(item.id) !==
          Number(id)
      );

    localSet(
      "social_links",
      state.social_links
    );

    renderSocialLinks();

    return;

  }

  const { error } =
    await supabaseClient

      .from("social_links")

      .delete()

      .eq("id", id);

  if (error)
    throw error;

  await loadState();

}
/* ==========================================
   UTILIDADES DE IMAGEN
========================================== */

async function fileToDataUrl(file) {

  return new Promise(
    (resolve, reject) => {

      const reader =
        new FileReader();

      reader.onload =
        () => resolve(reader.result);

      reader.onerror =
        reject;

      reader.readAsDataURL(file);

    }
  );

}

async function uploadImage(file, folder = "uploads") {

  if (!file)
    return "";

  if (!supabaseClient) {

    return fileToDataUrl(file);

  }

  const extension =
    file.name
      .split(".")
      .pop();

  const path =
    `${folder}/${
      Date.now()
    }-${
      crypto.randomUUID()
    }.${extension}`;

  const bucket =
    window.SUPABASE_CONFIG
      .storageBucket ||
    "gallery";

  const { error } =
    await supabaseClient

      .storage

      .from(bucket)

      .upload(
        path,
        file,
        {
          cacheControl: "3600",
          upsert: false
        }
      );

  if (error)
    throw error;

  const { data } =
    supabaseClient

      .storage

      .from(bucket)

      .getPublicUrl(path);

  return data.publicUrl;

}

/* ==========================================
   PROFILE FORM
========================================== */

document
  .querySelector(
    "#profile-form"
  )
  ?.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      const form =
        event.currentTarget;

      const data =
        new FormData(form);

      const file =
        data.get(
          "avatar_file"
        );

      let avatarUrl =
        data.get(
          "avatar_url"
        );

      if (
        file &&
        file.size
      ) {

        avatarUrl =
          await uploadImage(
            file,
            "avatars"
          );

      }

      const profile = {

        name:
          data.get("name"),

        headline:
          data.get("headline"),

        profession:
          data.get("profession"),

        location:
          data.get("location"),

        avatar_url:
          avatarUrl,

        email:
          data.get("email"),

        phone:
          data.get("phone"),

        linkedin:
          data.get("linkedin"),

        github:
          data.get("github"),

        about:
          data.get("about"),

        focus:
          data.get("focus")

      };

      await saveProfile(
        profile
      );

      alert(
        "Perfil guardado"
      );

    }
  );

/* ==========================================
   LOGIN
========================================== */
const loginForm =
  document.querySelector(
    "#login-form"
  );

loginForm?.addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    const form =
      event.currentTarget;

    const {
      email,
      password
    } =
      Object.fromEntries(
        new FormData(form)
          .entries()
      );

    const { error } =
      await supabaseClient
        .auth
        .signInWithPassword({
          email,
          password
        });

    if (error) {

      alert(error.message);

      return;

    }

    if (form) {
      form.reset();
    }

    await loadState();

  }
);
/* ==========================================
   HIGHLIGHTS
========================================== */

document
  .querySelector(
    "#highlight-form"
  )
  ?.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      const form =
        event.currentTarget;

      const item =
        Object.fromEntries(
          new FormData(
            form
          ).entries()
        );

      await saveHighlight(
        item
      );

      form.reset();

      form.elements.id.value =
        "";

    }
  );

/* ==========================================
   EXPERIENCE
========================================== */

document
  .querySelector(
    "#experience-form"
  )
  ?.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      const form =
        event.currentTarget;

      const item =
        Object.fromEntries(
          new FormData(
            form
          ).entries()
        );

      await saveExperience(
        item
      );

      form.reset();

      form.elements.id.value =
        "";

    }
  );

/* ==========================================
   PROJECTS
========================================== */

document
  .querySelector(
    "#project-form"
  )
  ?.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      const form =
        event.currentTarget;

      const data =
        new FormData(form);

      const file =
        data.get(
          "image_file"
        );

      const uploadedUrl =
        file?.size
          ? await uploadImage(
              file,
              "projects"
            )
          : "";

      const item = {

        id:
          data.get("id"),

        title:
          data.get("title"),

        description:
          data.get(
            "description"
          ),

        url:
          data.get("url"),

        sort_order:
          data.get(
            "sort_order"
          ),

        image_url:
          uploadedUrl ||
          data.get(
            "image_url"
          )

      };

      await saveProject(
        item
      );

      form.reset();

      form.elements.id.value =
        "";

    }
  );

/* ==========================================
   PHOTOS
========================================== */

document
  .querySelector(
    "#photo-form"
  )
  ?.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      const form =
        event.currentTarget;

      const data =
        new FormData(form);

      const file =
        data.get(
          "image_file"
        );

      const uploadedUrl =
        file?.size
          ? await uploadImage(
              file,
              "photos"
            )
          : "";

      const item = {

        id:
          data.get("id"),

        title:
          data.get("title"),

        description:
          data.get(
            "description"
          ),

        location:
          data.get(
            "location"
          ),

        sort_order:
          data.get(
            "sort_order"
          ),

        image_url:
          uploadedUrl ||
          data.get(
            "image_url"
          )

      };

      await savePhoto(
        item
      );

      form.reset();

      form.elements.id.value =
        "";

    }
  );

/* ==========================================
   SOCIAL LINKS
========================================== */

document
  .querySelector(
    "#social-form"
  )
  ?.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      const form =
        event.currentTarget;

      const item =
        Object.fromEntries(
          new FormData(
            form
          ).entries()
        );

      await saveSocialLink(
        item
      );

      form.reset();

      form.elements.id.value =
        "";

    }
  );

/* ==========================================
   BOTONES LIMPIAR
========================================== */

document
  .querySelector(
    "#clear-highlight"
  )
  ?.addEventListener(
    "click",
    () => {

      const form =
        document.querySelector(
          "#highlight-form"
        );

      form.reset();

      form.elements.id.value =
        "";

    }
  );

document
  .querySelector(
    "#clear-photo"
  )
  ?.addEventListener(
    "click",
    () => {

      const form =
        document.querySelector(
          "#photo-form"
        );

      form.reset();

      form.elements.id.value =
        "";

    }
  );

/* ==========================================
   EDITAR Y ELIMINAR
========================================== */

document.addEventListener(
  "click",
  async event => {

    const target =
      event.target;

    /* HIGHLIGHTS */

    if (
      target.closest(
        "[data-edit-highlight]"
      )
    ) {

      const id =
        target.closest(
          "[data-edit-highlight]"
        ).dataset
          .editHighlight;

      const item =
        state.highlights.find(
          x =>
            Number(x.id) ===
            Number(id)
        );

      const form =
        document.querySelector(
          "#highlight-form"
        );

      Object.entries(item)
        .forEach(
          ([k, v]) => {

            if (
              form.elements[k]
            ) {

              form.elements[
                k
              ].value =
                v || "";

            }

          }
        );

    }

    if (
      target.closest(
        "[data-delete-highlight]"
      )
    ) {

      await deleteHighlight(
        target.closest(
          "[data-delete-highlight]"
        ).dataset
          .deleteHighlight
      );

    }

    /* EXPERIENCE */

    if (
      target.closest(
        "[data-edit-experience]"
      )
    ) {

      const id =
        target.closest(
          "[data-edit-experience]"
        ).dataset
          .editExperience;

      const item =
        state.experience.find(
          x =>
            Number(x.id) ===
            Number(id)
        );

      const form =
        document.querySelector(
          "#experience-form"
        );

      Object.entries(item)
        .forEach(
          ([k, v]) => {

            if (
              form.elements[k]
            ) {

              form.elements[
                k
              ].value =
                v || "";

            }

          }
        );

    }

    if (
      target.closest(
        "[data-delete-experience]"
      )
    ) {

      await deleteExperience(
        target.closest(
          "[data-delete-experience]"
        ).dataset
          .deleteExperience
      );

    }

    /* PROJECTS */

    if (
      target.closest(
        "[data-edit-project]"
      )
    ) {

      const id =
        target.closest(
          "[data-edit-project]"
        ).dataset
          .editProject;

      const item =
        state.projects.find(
          x =>
            Number(x.id) ===
            Number(id)
        );

      const form =
        document.querySelector(
          "#project-form"
        );

      Object.entries(item)
        .forEach(
          ([k, v]) => {

            if (
              form.elements[k]
            ) {

              form.elements[
                k
              ].value =
                v || "";

            }

          }
        );

    }

    if (
      target.closest(
        "[data-delete-project]"
      )
    ) {

      await deleteProject(
        target.closest(
          "[data-delete-project]"
        ).dataset
          .deleteProject
      );

    }

    /* PHOTOS */

    if (
      target.closest(
        "[data-edit-photo]"
      )
    ) {

      const id =
        target.closest(
          "[data-edit-photo]"
        ).dataset
          .editPhoto;

      const item =
        state.photos.find(
          x =>
            Number(x.id) ===
            Number(id)
        );

      const form =
        document.querySelector(
          "#photo-form"
        );

      Object.entries(item)
        .forEach(
          ([k, v]) => {

            if (
              form.elements[k]
            ) {

              form.elements[
                k
              ].value =
                v || "";

            }

          }
        );

    }

    if (
      target.closest(
        "[data-delete-photo]"
      )
    ) {

      await deletePhoto(
        target.closest(
          "[data-delete-photo]"
        ).dataset
          .deletePhoto
      );

    }

    /* SOCIAL */

    if (
      target.closest(
        "[data-edit-social]"
      )
    ) {

      const id =
        target.closest(
          "[data-edit-social]"
        ).dataset
          .editSocial;

      const item =
        state.social_links.find(
          x =>
            Number(x.id) ===
            Number(id)
        );

      const form =
        document.querySelector(
          "#social-form"
        );

      Object.entries(item)
        .forEach(
          ([k, v]) => {

            if (
              form.elements[k]
            ) {

              form.elements[
                k
              ].value =
                v || "";

            }

          }
        );

    }

    if (
      target.closest(
        "[data-delete-social]"
      )
    ) {

      await deleteSocialLink(
        target.closest(
          "[data-delete-social]"
        ).dataset
          .deleteSocial
      );

    }

  }
);


const avatarInput =
  document.querySelector(
    '[name="avatar_file"]'
  );

avatarInput?.addEventListener(
  "change",
  event => {

    const file =
      event.target.files[0];

    if (!file) return;

    const preview =
      document.querySelector(
        "#avatar-preview"
      );

    preview.src =
      URL.createObjectURL(
        file
      );

    preview.style.display =
      "block";

  }
);
/* ==========================================
   INICIO
========================================== */

loadState();
