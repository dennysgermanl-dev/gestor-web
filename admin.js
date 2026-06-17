const defaults = {

  profile: {
    name: "Mi perfil personal",
    headline: "Tecnología, análisis y fotografía",
    location: "Perú",
    avatar_url: "",
    about:
      "Soy una persona comprometida con el aprendizaje continuo y el crecimiento profesional.",
    focus:
      "Integrar tecnología, análisis y creatividad para desarrollar soluciones modernas."
  },

  highlights: [],

  photos: [],

  experience: [],

  projects: [],

  social_links: []

};

let supabaseClient = null;
let state = {

  profile: { ...defaults.profile },

  highlights: [],

  photos: [],

  experience: [],

  projects: [],

  social_links: []

};

const $ = (selector) => document.querySelector(selector);
const hasSupabaseConfig = () =>
  Boolean(window.SUPABASE_CONFIG?.url && window.SUPABASE_CONFIG?.anonKey);
const localGet = (key, fallback) => {
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : fallback;
};
const localSet = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const nextId = (items) => Math.max(0, ...items.map((item) => Number(item.id) || 0)) + 1;
const bucketName = () => window.SUPABASE_CONFIG?.storageBucket || "gallery";

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, (char) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]
  );
}

function setupClient() {
  if (!hasSupabaseConfig()) return null;
  return window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey);
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.hidden = true;
  }, 2600);
}

function setLoading(isLoading) {
  document.body.classList.toggle("is-saving", isLoading);
}

async function loadState() {
  supabaseClient = setupClient();
  $("#admin-content").hidden = false;
  $("#auth-panel").hidden = true;
  $("#logout-button").hidden = !supabaseClient;
  $("#storage-status").textContent = supabaseClient
    ? "Conectado a Supabase. Los cambios se guardaran en tu base de datos."
    : "Modo local. Puedes probar el gestor ahora; para guardar en la nube, completa supabase-config.js.";

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

  photos:
    localGet(
      "photos",
      defaults.photos
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

  social_links:
    localGet(
      "social_links",
      defaults.social_links
    )

};
    renderAll();
    return;
  }

  const { data: sessionData } = await supabaseClient.auth.getSession();
  if (!sessionData.session) {
    $("#storage-status").textContent = "Conectado a Supabase. Inicia sesion para editar tu contenido.";
    $("#admin-content").hidden = true;
    $("#auth-panel").hidden = false;
    $("#logout-button").hidden = true;
    return;
  }

  const [

  { data: profile },

  { data: highlights },

  { data: photos },

  { data: experience },

  { data: projects },

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
    .order("sort_order", {
      ascending: true
    }),

  supabaseClient
    .from("photos")
    .select("*")
    .order("sort_order", {
      ascending: true
    }),

  supabaseClient
    .from("experience")
    .select("*")
    .order("sort_order", {
      ascending: true
    }),

  supabaseClient
    .from("projects")
    .select("*")
    .order("sort_order", {
      ascending: true
    }),

  supabaseClient
    .from("social_links")
    .select("*")
    .order("sort_order", {
      ascending: true
    })

]);
  
state = {

  profile:
    profile || defaults.profile,

  highlights:
    highlights || [],

  photos:
    photos || [],

  experience:
    experience || [],

  projects:
    projects || [],

  social_links:
    socialLinks || []

};
  renderAll();
}

function renderAll() {

  hideForms();

  renderProfile();

  renderHighlights();

  renderPhotos();

  renderExperience();

  renderProjects();

  renderSocialLinks();

}

function hideForms() {
  $("#profile-form").hidden = true;
  $("#highlight-form").hidden = true;
  $("#photo-form").hidden = true;
}

function renderProfile() {
  const profile = state.profile || defaults.profile;
  const avatar = profile.avatar_url
    ? `<img src="${escapeHTML(profile.avatar_url)}" alt="${escapeHTML(profile.name)}" />`
    : `<span>Foto</span>`;

  $("#profile-summary").innerHTML = `
    <div class="summary-avatar ${profile.avatar_url ? "" : "empty"}">${avatar}</div>
    <div class="summary-copy">
      <h3>${escapeHTML(profile.name)}</h3>
      <p class="summary-headline">${escapeHTML(profile.headline || "Sin frase principal")}</p>
      <p>${escapeHTML(profile.about || "Sin descripcion.")}</p>
      <p>${escapeHTML(profile.focus || "Sin objetivo registrado.")}</p>
      <span class="status-pill">${escapeHTML(profile.location || "Sin ubicacion")}</span>
    </div>
  `;
}

function renderHighlights() {
  const list = $("#highlight-list");
  list.innerHTML = "";

  if (!state.highlights.length) {
    list.innerHTML = `<div class="empty-state">No hay intereses publicados.</div>`;
    return;
  }

  state.highlights
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
    .forEach((item) => {
      const row = document.createElement("article");
      row.className = "content-card";
      row.innerHTML = `
        <div class="card-kicker">Orden ${escapeHTML(item.sort_order ?? 0)}</div>
        <h3>${escapeHTML(item.title)}</h3>
        <p>${escapeHTML(item.description)}</p>
        <div class="manager-actions">
          <button class="small-button" data-edit-highlight="${escapeHTML(item.id)}">Editar</button>
          <button class="small-button delete" data-delete-highlight="${escapeHTML(item.id)}">Eliminar</button>
        </div>
      `;
      list.append(row);
    });
}

function renderPhotos() {
  const list = $("#photo-list");
  list.innerHTML = "";

  if (!state.photos.length) {
    list.innerHTML = `<div class="empty-state">Aun no has agregado fotografias.</div>`;
    return;
  }

  state.photos
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
    .forEach((photo) => {
      const row = document.createElement("article");
      row.className = "content-card photo-card";
      row.innerHTML = `
        <div class="photo-thumb">
          ${photo.image_url ? `<img src="${escapeHTML(photo.image_url)}" alt="${escapeHTML(photo.title)}" />` : ""}
        </div>
        <div class="card-kicker">${escapeHTML(photo.location || "Sin ubicacion")}</div>
        <h3>${escapeHTML(photo.title)}</h3>
        <p>${escapeHTML(photo.description)}</p>
        <div class="manager-actions">
          <button class="small-button" data-edit-photo="${escapeHTML(photo.id)}">Editar</button>
          <button class="small-button delete" data-delete-photo="${escapeHTML(photo.id)}">Eliminar</button>
        </div>
      `;
      list.append(row);
    });
}

function renderExperience() {

  const list = $("#experience-list");

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
    .sort((a, b) =>
      Number(a.sort_order || 0) -
      Number(b.sort_order || 0)
    )
    .forEach((item) => {

      const card =
        document.createElement("article");

      card.className =
        "content-card";

      card.innerHTML = `

        <div class="card-kicker">
          ${escapeHTML(item.period || "")}
        </div>

        <h3>
          ${escapeHTML(item.title)}
        </h3>

        <strong>
          ${escapeHTML(item.company || "")}
        </strong>

        <p>
          ${escapeHTML(item.description || "")}
        </p>

        <div class="manager-actions">

          <button
            class="small-button"
            data-edit-experience="${item.id}">
            Editar
          </button>

          <button
            class="small-button delete"
            data-delete-experience="${item.id}">
            Eliminar
          </button>

        </div>

      `;

      list.append(card);

    });

}

function renderProjects() {

  const list =
    $("#projects-list");

  if (!list) return;

  list.innerHTML = "";

  if (!state.projects.length) {

    list.innerHTML = `
      <div class="empty-state">
        No hay proyectos publicados.
      </div>
    `;

    return;
  }

  state.projects
    .sort((a, b) =>
      Number(a.sort_order || 0) -
      Number(b.sort_order || 0)
    )
    .forEach((project) => {

      const card =
        document.createElement("article");

      card.className =
        "content-card";

      card.innerHTML = `

        <h3>
          ${escapeHTML(project.title)}
        </h3>

        <p>
          ${escapeHTML(project.description)}
        </p>

        <div class="manager-actions">

          <button
            class="small-button"
            data-edit-project="${project.id}">
            Editar
          </button>

          <button
            class="small-button delete"
            data-delete-project="${project.id}">
            Eliminar
          </button>

        </div>

      `;

      list.append(card);

    });

}

function renderSocialLinks() {

  const list =
    $("#social-list");

  if (!list) return;

  list.innerHTML = "";

  if (!state.social_links.length) {

    list.innerHTML = `
      <div class="empty-state">
        No hay redes registradas.
      </div>
    `;

    return;
  }

  state.social_links
    .sort((a, b) =>
      Number(a.sort_order || 0) -
      Number(b.sort_order || 0)
    )
    .forEach((social) => {

      const card =
        document.createElement("article");

      card.className =
        "content-card";

      card.innerHTML = `

        <h3>
          ${escapeHTML(
            social.platform
          )}
        </h3>

        <p>
          ${escapeHTML(
            social.url
          )}
        </p>

        <div class="manager-actions">

          <button
            class="small-button"
            data-edit-social="${social.id}">
            Editar
          </button>

          <button
            class="small-button delete"
            data-delete-social="${social.id}">
            Eliminar
          </button>

        </div>

      `;

      list.append(card);

    });

}

function renderPreview(selector, imageUrl) {
  const preview = $(selector);
  if (!imageUrl) {
    preview.hidden = true;
    preview.innerHTML = "";
    return;
  }
  preview.hidden = false;
  preview.innerHTML = `<img src="${escapeHTML(imageUrl)}" alt="Vista previa" />`;
}

function fillProfileForm() {
  const form = $("#profile-form");
  const profile = state.profile || defaults.profile;
  Object.entries(profile).forEach(([key, value]) => {
    if (form.elements[key]) form.elements[key].value = value || "";
  });
  renderPreview("#profile-preview", profile.avatar_url);
  form.hidden = false;
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetHighlightForm(item = {}) {
  const form = $("#highlight-form");
  form.reset();
  form.elements.id.value = item.id || "";
  form.elements.title.value = item.title || "";
  form.elements.description.value = item.description || "";
  form.elements.sort_order.value = item.sort_order ?? 0;
  form.hidden = false;
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetPhotoForm(item = {}) {
  const form = $("#photo-form");
  form.reset();
  form.elements.id.value = item.id || "";
  form.elements.title.value = item.title || "";
  form.elements.description.value = item.description || "";
  form.elements.location.value = item.location || "";
  form.elements.sort_order.value = item.sort_order ?? 0;
  form.elements.image_url.value = item.image_url || "";
  form.elements.external_url.value = item.image_url || "";
  renderPreview("#photo-preview", item.image_url);
  form.hidden = false;
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadImageFile(file, folder) {
  if (!file || !file.size) return "";

  if (!supabaseClient) {
    return fileToDataUrl(file);
  }

  const extension = file.name.split(".").pop();
  const path = `${folder}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const { error } = await supabaseClient.storage.from(bucketName()).upload(path, file, {
    cacheControl: "3600",
    upsert: false
  });
  if (error) throw error;

  const { data } = supabaseClient.storage.from(bucketName()).getPublicUrl(path);
  return data.publicUrl;
}

async function saveProfile(profile) {
  if (!supabaseClient) {
    state.profile = profile;
    localSet("profile", profile);
    return;
  }

  const { error } = await supabaseClient
    .from("profile")
    .upsert({ id: 1, ...profile, updated_at: new Date().toISOString() });
  if (error) throw error;
  state.profile = profile;
}

async function deleteProfile() {
  if (!supabaseClient) {
    state.profile = { ...defaults.profile };
    localSet("profile", state.profile);
    renderAll();
    return;
  }

  const { error } = await supabaseClient.from("profile").delete().eq("id", 1);
  if (error) throw error;
  state.profile = { ...defaults.profile };
  renderAll();
}

async function saveHighlight(item) {
  if (!supabaseClient) {
    const id = item.id ? Number(item.id) : nextId(state.highlights);
    const saved = { ...item, id, sort_order: Number(item.sort_order || 0) };
    state.highlights = state.highlights.filter((entry) => Number(entry.id) !== id).concat(saved);
    localSet("highlights", state.highlights);
    renderAll();
    return;
  }

  const payload = { ...item, sort_order: Number(item.sort_order || 0) };
  if (!payload.id) delete payload.id;
  const { error } = await supabaseClient.from("highlights").upsert(payload);
  if (error) throw error;
  await loadState();
}

async function deleteHighlight(id) {
  if (!supabaseClient) {
    state.highlights = state.highlights.filter((item) => Number(item.id) !== Number(id));
    localSet("highlights", state.highlights);
    renderAll();
    return;
  }

  const { error } = await supabaseClient.from("highlights").delete().eq("id", id);
  if (error) throw error;
  await loadState();
}

async function savePhoto(item) {
  if (!supabaseClient) {
    const id = item.id ? Number(item.id) : nextId(state.photos);
    const saved = { ...item, id, sort_order: Number(item.sort_order || 0) };
    state.photos = state.photos.filter((entry) => Number(entry.id) !== id).concat(saved);
    localSet("photos", state.photos);
    renderAll();
    return;
  }

  const payload = { ...item, sort_order: Number(item.sort_order || 0) };
  if (!payload.id) delete payload.id;
  const { error } = await supabaseClient.from("photos").upsert(payload);
  if (error) throw error;
  await loadState();
}
async function saveExperience(item) {

  if (!supabaseClient) {

    const id =
      item.id
        ? Number(item.id)
        : nextId(state.experience);

    const saved = {
      ...item,
      id
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

    renderAll();

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
      .from("experience")
      .upsert(payload);

  if (error)
    throw error;

  await loadState();

}

async function saveProject(item) {

  if (!supabaseClient) {

    const id =
      item.id
        ? Number(item.id)
        : nextId(state.projects);

    const saved = {
      ...item,
      id
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

    renderAll();

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
      .from("projects")
      .upsert(payload);

  if (error)
    throw error;

  await loadState();

}
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
      id
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

    renderAll();

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
      .from("social_links")
      .upsert(payload);

  if (error)
    throw error;

  await loadState();

}

async function deleteExperience(id) {

  const { error } =
    await supabaseClient
      .from("experience")
      .delete()
      .eq("id", id);

  if (error)
    throw error;

  await loadState();

}
async function deleteProject(id) {

  const { error } =
    await supabaseClient
      .from("projects")
      .delete()
      .eq("id", id);

  if (error)
    throw error;

  await loadState();

}

async function deleteSocialLink(id) {

  const { error } =
    await supabaseClient
      .from("social_links")
      .delete()
      .eq("id", id);

  if (error)
    throw error;

  await loadState();

}
async function deletePhoto(id) {
  if (!supabaseClient) {
    state.photos = state.photos.filter((item) => Number(item.id) !== Number(id));
    localSet("photos", state.photos);
    renderAll();
    return;
  }

  const { error } = await supabaseClient.from("photos").delete().eq("id", id);
  if (error) throw error;
  await loadState();
}

$("#login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const { email, password } = Object.fromEntries(new FormData(form).entries());
  setLoading(true);
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  setLoading(false);
  if (error) {
    showToast(error.message);
    return;
  }
  form.reset();
  await loadState();
});

$("#logout-button").addEventListener("click", async () => {
  if (supabaseClient) await supabaseClient.auth.signOut();
  await loadState();
});

$("#edit-profile").addEventListener("click", fillProfileForm);
$("#cancel-profile").addEventListener("click", () => {
  $("#profile-form").hidden = true;
});
$("#delete-profile").addEventListener("click", async () => {
  setLoading(true);
  await deleteProfile();
  setLoading(false);
  showToast("Perfil eliminado");
});

$("#new-highlight").addEventListener("click", () => resetHighlightForm());
$("#cancel-highlight").addEventListener("click", () => {
  $("#highlight-form").hidden = true;
});

$("#new-photo").addEventListener("click", () => resetPhotoForm());
$("#cancel-photo").addEventListener("click", () => {
  $("#photo-form").hidden = true;
});

$("#profile-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const avatarFile = data.get("avatar_file");
  setLoading(true);
  const uploadedAvatar = avatarFile?.size ? await uploadImageFile(avatarFile, "profile") : "";
  const profile = {
    name: data.get("name"),
    headline: data.get("headline"),
    location: data.get("location"),
    avatar_url: uploadedAvatar || data.get("avatar_url"),
    about: data.get("about"),
    focus: data.get("focus")
  };
  await saveProfile(profile);
  setLoading(false);
  $("#profile-form").hidden = true;
  renderProfile();
  showToast("Perfil guardado");
});

$("#highlight-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const item = Object.fromEntries(new FormData(form).entries());
  setLoading(true);
  await saveHighlight(item);
  setLoading(false);
  form.hidden = true;
  showToast("Interes guardado");
});

$("#photo-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const file = data.get("image_file");
  setLoading(true);
  const uploadedUrl = file?.size ? await uploadImageFile(file, "photos") : "";
  const item = {
    id: data.get("id"),
    title: data.get("title"),
    description: data.get("description"),
    location: data.get("location"),
    sort_order: data.get("sort_order"),
    image_url: uploadedUrl || data.get("external_url") || data.get("image_url")
  };
  await savePhoto(item);
  setLoading(false);
  form.hidden = true;
  showToast("Foto guardada");
});

$("#profile-form").elements.avatar_file.addEventListener("change", async (event) => {
  const file = event.currentTarget.files[0];
  renderPreview("#profile-preview", file ? await fileToDataUrl(file) : $("#profile-form").elements.avatar_url.value);
});

$("#photo-form").elements.image_file.addEventListener("change", async (event) => {
  const file = event.currentTarget.files[0];
  renderPreview("#photo-preview", file ? await fileToDataUrl(file) : $("#photo-form").elements.image_url.value);
});

document.addEventListener("click", async (event) => {
  const editHighlight = event.target.closest("[data-edit-highlight]");
  const deleteHighlightButton = event.target.closest("[data-delete-highlight]");
  const editPhoto = event.target.closest("[data-edit-photo]");
  const deletePhotoButton = event.target.closest("[data-delete-photo]");

  if (editHighlight) {
    const item = state.highlights.find((entry) => Number(entry.id) === Number(editHighlight.dataset.editHighlight));
    if (item) resetHighlightForm(item);
  }

  if (deleteHighlightButton) {
    setLoading(true);
    await deleteHighlight(deleteHighlightButton.dataset.deleteHighlight);
    setLoading(false);
    showToast("Interes eliminado");
  }

  if (editPhoto) {
    const item = state.photos.find((entry) => Number(entry.id) === Number(editPhoto.dataset.editPhoto));
    if (item) resetPhotoForm(item);
  }

  if (deletePhotoButton) {
    setLoading(true);
    await deletePhoto(deletePhotoButton.dataset.deletePhoto);
    setLoading(false);
    showToast("Foto eliminada");
  }
});

loadState();
