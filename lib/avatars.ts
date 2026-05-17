export const avatarOptions = [
  { id: "avatar:crown", label: "Crown", symbol: "K", className: "bg-amber-400 text-slate-950" },
  { id: "avatar:teal", label: "Teal", symbol: "A", className: "bg-teal-500 text-white" },
  { id: "avatar:rose", label: "Rose", symbol: "D", className: "bg-rose-500 text-white" },
  { id: "avatar:indigo", label: "Indigo", symbol: "N", className: "bg-indigo-500 text-white" },
  { id: "avatar:slate", label: "Slate", symbol: "Q", className: "bg-slate-900 text-amber-300" }
];

export function getAvatarOption(id?: string) {
  return avatarOptions.find((avatar) => avatar.id === id);
}
