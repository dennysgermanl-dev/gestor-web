const defaults = {
  profile: {
    name: "Mi perfil personal",
    headline: "Tecnologia, analisis y fotografia desde celular",
    location: "Peru",
    avatar_url: "",
    about:
      "Soy una persona proactiva, responsable y comprometida con mi crecimiento personal y profesional. Me caracteriza una mentalidad de aprendizaje constante, buscando siempre adquirir nuevos conocimientos y desarrollar habilidades para enfrentar retos en el ambito tecnologico y creativo.",
    focus:
      "Mi objetivo es seguir creciendo profesionalmente, integrando tecnologia, analisis y creatividad para desarrollar proyectos funcionales, modernos y con impacto positivo."
  },
  highlights: [
    {
      id: 1,
      title: "Desarrollo de sistemas",
      description:
        "Formacion en Desarrollo de Sistemas de Informacion, con capacidades en tecnologia, organizacion, analisis y resolucion de problemas.",
      sort_order: 1
    },
    {
      id: 2,
      title: "Fotografia y video",
      description:
        "Me apasiona capturar momentos, crear contenido visual y transmitir ideas mediante recursos audiovisuales usando principalmente mi celular.",
      sort_order: 2
    },
    {
      id: 3,
      title: "Investigacion operativa",
      description:
        "Estudio Investigacion Operativa para fortalecer mi pensamiento analitico, la toma de decisiones y el uso de modelos de optimizacion.",
      sort_order: 3
    }
  ],
  photos: []
};

let supabaseClient = null;
let state = {
  profile: defaults.profile,
  highlights: [],
  photos: []
};

const hasSupabaseConfig = () =>
  Boolean(window.SUPABASE_CONFIG?.url && window.SUPABASE_CONFIG?.anonKey);

const localGet = (key, fallback) => {
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : fallback;
};

const localSet = (key, value) => localStorage.setItem(key, JSON.stringify(value));

const nextId = (items) => Math.max(0, ...items.map((item) => Number(item.id) || 0)) + 1;

function setupClient() {
  if (!hasSupabaseConfig()) return null;
  return window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey);
}

async function loadState() {
  supabaseClient = setupClient();
  document.querySelector("#admin-content").hidden = false;
  document.querySelector("#auth-panel").hidden = true;
  document.querySelector("#storage-status").textContent = supabaseClient
    ? "Conectado a Supabase. Los cambios se guardaran en tu base de datos."
    : "Modo local. Puedes probar el gestor ahora; para guardar en la nube, completa supabase-config.js.";

  if (!supabaseClient) {
    state = {
      profile: localGet("profile", defaults.profile),
      highlights: localGet("highlights", defaults.highlights),
      photos: localGet("photos", defaults.photos)
    };
    renderAll();
    return;
  }

  const { data: sessionData } = await supabaseClient.auth.getSession();
  if (!sessionData.session) {
    document.querySelector("#storage-status").textContent =
      "Conectado a Supabase. Inicia sesion para editar tu contenido.";
    document.querySelector("#admin-content").hidden = true;
    document.querySelector("#auth-panel").hidden = false;
    return;
  }

  const [{ data: profile }, { data: highlights }, { data: photos }] = await Promise.all([
    supabaseClient.from("profile").select("*").eq("id", 1).single(),
    supabaseClient.from("highlights").select("*").order("sort_order", { ascending: true }),
    supabaseClient.from("photos").select("*").order("sort_order", { ascending: true })
  ]);

  state = {
    profile: profile || defaults.profile,
    highlights: highlights?.length ? highlights : defaults.highlights,
    photos: photos || []
  };
  renderAll();
}

function fillProfileForm() {
  const form = document.querySelector("#profile-form");
  Object.entries(state.profile).forEach(([key, value]) => {
    if (form.elements[key]) form.elements[key].value = value || "";
  });
}

function renderHighlights() {
  const list = document.querySelector("#highlight-list");
  list.innerHTML = "";
  state.highlights
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
    .forEach((item) => {
      const row = document.createElement("article");
      row.className = "manager-item";
      row.innerHTML = `
        <div>
          <h3>${item.title}</h3>
          <p>${item.description}</p>
        </div>
        <div class="manager-actions">
          <button class="small-button" data-edit-highlight="${item.id}">Editar</button>
          <button class="small-button delete" data-delete-highlight="${item.id}">Eliminar</button>
        </div>
      `;
      list.append(row);
    });
}

function renderPhotos() {
  const list = document.querySelector("#photo-list");
  list.innerHTML = "";

  if (!state.photos.length) {
    list.innerHTML = `<div class="empty-state">Aun no has agregado fotografias.</div>`;
    return;
  }

  state.photos
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
    .forEach((photo) => {
      const row = document.createElement("article");
      row.className = "manager-item";
      row.innerHTML = `
        <div>
          ${photo.image_url ? `<img src="${photo.image_url}" alt="${photo.title}" />` : ""}
          <h3>${photo.title}</h3>
          <p>${photo.description}</p>
        </div>
        <div class="manager-actions">
          <button class="small-button" data-edit-photo="${photo.id}">Editar</button>
          <button class="small-button delete" data-delete-photo="${photo.id}">Eliminar</button>
        </div>
      `;
      list.append(row);
    });
}

function renderAll() {
  fillProfileForm();
  renderHighlights();
  renderPhotos();
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

async function saveHighlight(item) {
  if (!supabaseClient) {
    const id = item.id ? Number(item.id) : nextId(state.highlights);
    const saved = { ...item, id, sort_order: Number(item.sort_order || 0) };
    state.highlights = state.highlights.filter((entry) => Number(entry.id) !== id).concat(saved);
    localSet("highlights", state.highlights);
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
    renderHighlights();
    return;
  }

  const { error } = await supabaseClient.from("highlights").delete().eq("id", id);
  if (error) throw error;
  await loadState();
}

async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadPhotoFile(file) {
  if (!file) return "";

  if (!supabaseClient) {
    return fileToDataUrl(file);
  }

  const extension = file.name.split(".").pop();
  const path = `photos/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const bucket = window.SUPABASE_CONFIG.storageBucket || "gallery";
  const { error } = await supabaseClient.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false
  });
  if (error) throw error;

  const { data } = supabaseClient.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

async function savePhoto(item) {
  if (!supabaseClient) {
    const id = item.id ? Number(item.id) : nextId(state.photos);
    const saved = { ...item, id, sort_order: Number(item.sort_order || 0) };
    state.photos = state.photos.filter((entry) => Number(entry.id) !== id).concat(saved);
    localSet("photos", state.photos);
    return;
  }

  const payload = { ...item, sort_order: Number(item.sort_order || 0) };
  if (!payload.id) delete payload.id;
  const { error } = await supabaseClient.from("photos").upsert(payload);
  if (error) throw error;
  await loadState();
}

async function deletePhoto(id) {
  if (!supabaseClient) {
    state.photos = state.photos.filter((item) => Number(item.id) !== Number(id));
    localSet("photos", state.photos);
    renderPhotos();
    return;
  }

  const { error } = await supabaseClient.from("photos").delete().eq("id", id);
  if (error) throw error;
  await loadState();
}

document.querySelector("#profile-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const profile = Object.fromEntries(new FormData(form).entries());
  await saveProfile(profile);
  alert("Perfil guardado");
});

document.querySelector("#login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const { email, password } = Object.fromEntries(new FormData(form).entries());
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    alert(error.message);
    return;
  }
  form.reset();
  await loadState();
});

document.querySelector("#highlight-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const item = Object.fromEntries(new FormData(form).entries());
  await saveHighlight(item);
  form.reset();
  form.elements.id.value = "";
  if (!supabaseClient) renderHighlights();
});

document.querySelector("#photo-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const file = data.get("image_file");
  const uploadedUrl = file?.size ? await uploadPhotoFile(file) : "";
  const item = {
    id: data.get("id"),
    title: data.get("title"),
    description: data.get("description"),
    location: data.get("location"),
    sort_order: data.get("sort_order"),
    image_url: uploadedUrl || data.get("image_url")
  };
  await savePhoto(item);
  form.reset();
  form.elements.id.value = "";
  if (!supabaseClient) renderPhotos();
});

document.querySelector("#clear-highlight").addEventListener("click", () => {
  document.querySelector("#highlight-form").reset();
  document.querySelector("#highlight-form").elements.id.value = "";
});

document.querySelector("#clear-photo").addEventListener("click", () => {
  document.querySelector("#photo-form").reset();
  document.querySelector("#photo-form").elements.id.value = "";
});

document.addEventListener("click", async (event) => {
  const editHighlight = event.target.closest("[data-edit-highlight]");
  const deleteHighlightButton = event.target.closest("[data-delete-highlight]");
  const editPhoto = event.target.closest("[data-edit-photo]");
  const deletePhotoButton = event.target.closest("[data-delete-photo]");

  if (editHighlight) {
    const item = state.highlights.find((entry) => Number(entry.id) === Number(editHighlight.dataset.editHighlight));
    const form = document.querySelector("#highlight-form");
    Object.entries(item).forEach(([key, value]) => {
      if (form.elements[key]) form.elements[key].value = value || "";
    });
  }

  if (deleteHighlightButton) {
    await deleteHighlight(deleteHighlightButton.dataset.deleteHighlight);
  }

  if (editPhoto) {
    const item = state.photos.find((entry) => Number(entry.id) === Number(editPhoto.dataset.editPhoto));
    const form = document.querySelector("#photo-form");
    Object.entries(item).forEach(([key, value]) => {
      if (form.elements[key]) form.elements[key].value = value || "";
    });
  }

  if (deletePhotoButton) {
    await deletePhoto(deletePhotoButton.dataset.deletePhoto);
  }
});

loadState();
