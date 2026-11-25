export type MeuNiverPhoto = {
  id: string;
  src: string;
  position: readonly [number, number, number];
  rotation: readonly [number, number, number];
  size: readonly [number, number];
};

export type MeuNiverScene = {
  templateId: "meu-niver-3d";
  version: 1;
  name: "Meu Niver 3D";
  title: "Meu Niver";
  background: "#ff725e";
  star: "#d9fd61";
  confetti: "#475cfa";
  coverSrc: "/brand/v2/templates/meu-niver-cover.webp";
  photos: readonly MeuNiverPhoto[];
};

export const MEU_NIVER_SCENE: MeuNiverScene = {
  templateId: "meu-niver-3d",
  version: 1,
  name: "Meu Niver 3D",
  title: "Meu Niver",
  background: "#ff725e",
  star: "#d9fd61",
  confetti: "#475cfa",
  coverSrc: "/brand/v2/templates/meu-niver-cover.webp",
  photos: [
    {
      id: "friends",
      src: "/brand/v2/photos/birthday/friends.webp",
      position: [-1.7, 0.35, 0.15],
      rotation: [0, 0.18, -0.16],
      size: [1.7, 2.15],
    },
    {
      id: "cake",
      src: "/brand/v2/photos/birthday/cake.webp",
      position: [1.55, 0.85, -0.25],
      rotation: [0, -0.2, 0.12],
      size: [1.45, 1.85],
    },
    {
      id: "wish",
      src: "/brand/v2/photos/birthday/wish.webp",
      position: [-0.15, -1.15, 0.35],
      rotation: [0, 0.05, 0.08],
      size: [1.8, 1.35],
    },
    {
      id: "selfie",
      src: "/brand/v2/photos/birthday/selfie.webp",
      position: [1.65, -0.85, 0.05],
      rotation: [0, -0.12, -0.1],
      size: [1.4, 1.75],
    },
    {
      id: "party",
      src: "/brand/v2/photos/murals/birthday-party.webp",
      position: [0.05, 0.95, -0.55],
      rotation: [0, 0, 0.04],
      size: [1.55, 1.55],
    },
  ],
};
