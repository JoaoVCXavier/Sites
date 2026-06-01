const modal = document.getElementById("modal");
const modalTitulo = document.getElementById("modalTitulo");
const modalTexto = document.getElementById("modalTexto");
const modalIcone = document.getElementById("modalIcone");

const conteudos = {
  clinica: {
    titulo: "Clínica Geral",
    texto: "Responsável pela prevenção, diagnóstico e tratamentos odontológicos básicos, garantindo a saúde bucal e acompanhando o paciente de forma completa.",
    icone: "fa-solid fa-tooth"
  },

  pediatria: {
    titulo: "Odontopediatria",
    texto: "Especialidade voltada ao atendimento infantil, com abordagem acolhedora e técnicas que tornam o tratamento confortável e seguro para as crianças.",
    icone: "fa-solid fa-baby"
  },

  implantes: {
    titulo: "Implantes Dentários",
    texto: "Reposição de dentes perdidos com tecnologia moderna, devolvendo estética, mastigação e qualidade de vida ao paciente.",
    icone: "fa-solid fa-screwdriver-wrench"
  },

  ortodontia: {
    titulo: "Ortodontia",
    texto: "Correção do posicionamento dos dentes e mordida, proporcionando alinhamento, estética e melhor função mastigatória.",
    icone: "fa-solid fa-teeth"
  },

  estetica: {
    titulo: "Estética Dental",
    texto: "Tratamentos que valorizam o sorriso, como clareamento, facetas e reabilitações estéticas.",
    icone: "fa-solid fa-star"
  },

  endo: {
    titulo: "Endodontia",
    texto: "Tratamento de canal realizado com tecnologia e precisão, eliminando dor e preservando o dente natural.",
    icone: "fa-solid fa-stethoscope"
  },

  harmonizacao: {
    titulo: "Harmonização Orofacial",
    texto: "Procedimentos estéticos faciais que equilibram o sorriso e os traços do rosto.",
    icone: "fa-solid fa-face-smile"
  },

  bruxismo: {
    titulo: "Bruxismo",
    texto: "Diagnóstico e tratamento do ranger ou apertamento dos dentes.",
    icone: "fa-solid fa-moon"
  }
};

function abrirModal(tipo) {
  modalTitulo.innerText = conteudos[tipo].titulo;
  modalTexto.innerText = conteudos[tipo].texto;
  modalIcone.innerHTML = `<i class="${conteudos[tipo].icone}"></i>`;

  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function fecharModal() {
  modal.classList.remove("flex");
  modal.classList.add("hidden");
}

modal?.addEventListener("click", (e) => {
  if (e.target === modal) fecharModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") fecharModal();
});

/* GALERIA */
function abrirImagem(src) {
  const modalImagem = document.getElementById("modalImagem");
  const imagemExpandida = document.getElementById("imagemExpandida");

  imagemExpandida.src = src;
  modalImagem.classList.remove("hidden");
  modalImagem.classList.add("flex");
}

function fecharImagem() {
  const modalImagem = document.getElementById("modalImagem");
  modalImagem.classList.remove("flex");
  modalImagem.classList.add("hidden");
}

document.getElementById("modalImagem")?.addEventListener("click", function (e) {
  if (e.target.id === "modalImagem") {
    fecharImagem();
  }
});

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    fecharImagem();
  }
});

/* MENU MOBILE */
const menuToggle = document.getElementById("menuToggle");
const mobileMenu = document.getElementById("mobileMenu");
const mobileLinks = document.querySelectorAll(".mobile-link");

menuToggle?.addEventListener("click", () => {
  mobileMenu.classList.toggle("active");
});

mobileLinks.forEach((link) => {
  link.addEventListener("click", () => {
    mobileMenu.classList.remove("active");
  });
});