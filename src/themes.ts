export interface ThemeDef {
  id: string;
  name: string;
  category: "light" | "dark" | "amoled";
  colors: {
    bg: string;
    text: string;
    accent1: string;
    accent2?: string;
    accent3?: string;
    accent4?: string;
    accent5?: string;
    accent6?: string;
    accent7?: string;
    accent8?: string;
    accent9?: string;
    accent10?: string;
  };
}

export const themes: ThemeDef[] = [
  // LIGHT MODE
  { id: "sepia-paper", name: "Sepia Paper", category: "light", colors: { bg: "#F4ECD8", text: "#433422", accent1: "#A67C52", accent2: "#C19A6B", accent3: "#D7B899", accent4: "#8C6A43", accent5: "#E8D8C3", accent6: "#B58B60", accent7: "#D9C2A3", accent8: "#9C7350", accent9: "#EDE1D1", accent10: "#7A5B3A" } },
  { id: "nordic-light", name: "Nordic Light", category: "light", colors: { bg: "#F3F4F6", text: "#2D3748", accent1: "#5AB2C7", accent2: "#8BC9D8", accent3: "#D8EEF3", accent4: "#7B8794", accent5: "#AAB7C4", accent6: "#6FAFC0", accent7: "#C4DCE4", accent8: "#607086", accent9: "#E4EDF2", accent10: "#90A4B4" } },
  { id: "matcha-latte", name: "Matcha Latte", category: "light", colors: { bg: "#E8EFE9", text: "#2F3E32", accent1: "#8AA682", accent2: "#AFC8A6", accent3: "#6F8F68", accent4: "#D6E3D2", accent5: "#B8C7B2", accent6: "#95B08D", accent7: "#7C9875", accent8: "#E3ECE0", accent9: "#5E775A", accent10: "#C8D6C3" } },
  { id: "rose-quartz", name: "Rose Quartz", category: "light", colors: { bg: "#FAF0F2", text: "#4A3E41", accent1: "#D4A5B1", accent2: "#E8C6CF", accent3: "#BE8A97", accent4: "#F3DDE3", accent5: "#A56F7D", accent6: "#C796A3", accent7: "#EFD0D8", accent8: "#8E5D69", accent9: "#F7E8EC", accent10: "#B98491" } },
  { id: "soft-sand", name: "Soft Sand", category: "light", colors: { bg: "#F0EAE1", text: "#3E3A35", accent1: "#C2A685", accent2: "#D6C0A7", accent3: "#AE8F6A", accent4: "#E8D9C8", accent5: "#8F7759", accent6: "#CDB396", accent7: "#F0E5D8", accent8: "#7C654C", accent9: "#B89A76", accent10: "#DCCAB5" } },
  { id: "cloudy-day", name: "Cloudy Day", category: "light", colors: { bg: "#EAECEE", text: "#2C3E50", accent1: "#7FB3D5", accent2: "#A9CCE3", accent3: "#5D8AA8", accent4: "#D6EAF8", accent5: "#4A6C8C", accent6: "#8EBEDB", accent7: "#C5DFF0", accent8: "#6E9EBB", accent9: "#E8F3FA", accent10: "#547692" } },
  { id: "lavender-mist", name: "Lavender Mist", category: "light", colors: { bg: "#F2EFF9", text: "#3F3A4F", accent1: "#A393BF", accent2: "#C8BFE0", accent3: "#8674A8", accent4: "#E3DEF1", accent5: "#6A5A88", accent6: "#B5A8D0", accent7: "#D7D0E9", accent8: "#7A689A", accent9: "#EFEAF8", accent10: "#9485B5" } },
  { id: "vanilla-cream", name: "Vanilla Cream", category: "light", colors: { bg: "#FAF6E8", text: "#423F35", accent1: "#DEC27A", accent2: "#E9D6A5", accent3: "#C7A85A", accent4: "#F5ECCC", accent5: "#A98A45", accent6: "#D5B86A", accent7: "#F0E2B8", accent8: "#B5944E", accent9: "#FBF4DB", accent10: "#8F7539" } },
  { id: "sage-garden", name: "Sage Garden", category: "light", colors: { bg: "#EEF1EC", text: "#353D32", accent1: "#9DB298", accent2: "#B7C8B3", accent3: "#7E9879", accent4: "#D7E1D4", accent5: "#5F775B", accent6: "#A8BCA3", accent7: "#C8D6C4", accent8: "#718A6C", accent9: "#E7EEE5", accent10: "#8DA287" } },
  { id: "oatmeal", name: "Oatmeal", category: "light", colors: { bg: "#F5F2EB", text: "#4A4741", accent1: "#C5B499", accent2: "#D9CCB7", accent3: "#AA9578", accent4: "#EDE5D9", accent5: "#8C7760", accent6: "#CDBEA7", accent7: "#E4D8C8", accent8: "#9A846B", accent9: "#F5F0E7", accent10: "#B6A085" } },

  // DARK MODE
  { id: "dracula-soft", name: "Dracula Soft", category: "dark", colors: { bg: "#282A36", text: "#F8F8F2", accent1: "#FF79C6", accent2: "#FFB3DA", accent3: "#BD93F9", accent4: "#8BE9FD", accent5: "#F1FA8C", accent6: "#FF92CF", accent7: "#D3B3FF", accent8: "#C7F3FD", accent9: "#FFF5B1", accent10: "#E5D7FF" } },
  { id: "deep-ocean", name: "Deep Ocean", category: "dark", colors: { bg: "#0F172A", text: "#E2E8F0", accent1: "#38BDF8", accent2: "#7DD3FC", accent3: "#0EA5E9", accent4: "#BFDBFE", accent5: "#1D4ED8", accent6: "#5BC8F7", accent7: "#8CCFF4", accent8: "#2C7FB8", accent9: "#D8ECFF", accent10: "#6AA7D8" } },
  { id: "charcoal-mist", name: "Charcoal Mist", category: "dark", colors: { bg: "#202124", text: "#E8EAED", accent1: "#8AB4F8", accent2: "#AFCBFA", accent3: "#669DF6", accent4: "#D2E3FC", accent5: "#4A86E8", accent6: "#9ABFF8", accent7: "#C5D9FC", accent8: "#5B95F0", accent9: "#E6F0FF", accent10: "#7AA9F4" } },
  { id: "forest-night", name: "Forest Night", category: "dark", colors: { bg: "#141E17", text: "#E1E9E3", accent1: "#528B67", accent2: "#7AA388", accent3: "#3D6E50", accent4: "#BFD3C4", accent5: "#96B39E", accent6: "#6F9B7C", accent7: "#D6E1D8", accent8: "#315A42", accent9: "#A8BFAE", accent10: "#4A7A59" } },
  { id: "evergreen", name: "Evergreen", category: "dark", colors: { bg: "#1A231F", text: "#E6EDE9", accent1: "#D4AF37", accent2: "#E3C96A", accent3: "#B89225", accent4: "#F0E0A8", accent5: "#8A6E1F", accent6: "#C9A73A", accent7: "#EAD588", accent8: "#A68320", accent9: "#F7EDC9", accent10: "#6E5619" } },
  { id: "midnight-blue", name: "Midnight Blue", category: "dark", colors: { bg: "#101424", text: "#E0E4F0", accent1: "#F0C243", accent2: "#F5D67A", accent3: "#D9A520", accent4: "#FFF0B8", accent5: "#A67C00", accent6: "#E4BC52", accent7: "#F8E0A0", accent8: "#BF9420", accent9: "#FFF6D6", accent10: "#8A6700" } },
  { id: "chocolate-dark", name: "Chocolate Dark", category: "dark", colors: { bg: "#1F1A17", text: "#EBE6E1", accent1: "#C99A72", accent2: "#DDBA9A", accent3: "#A97A53", accent4: "#E9D4BF", accent5: "#8B5E3C", accent6: "#C6A17F", accent7: "#F2E4D4", accent8: "#755037", accent9: "#B98A63", accent10: "#D8B89D" } },
  { id: "slate-stone", name: "Slate Stone", category: "dark", colors: { bg: "#1E222B", text: "#ABB2BF", accent1: "#61AFEF", accent2: "#8FC6F4", accent3: "#3D8ED8", accent4: "#CFE6FA", accent5: "#275F8A", accent6: "#76BAF0", accent7: "#B7D8F8", accent8: "#4A98D8", accent9: "#E6F3FD", accent10: "#316D99" } },
  { id: "nord-night", name: "Nord Night", category: "dark", colors: { bg: "#2E3440", text: "#D8DEE9", accent1: "#88C0D0", accent2: "#A3D5DF", accent3: "#5E81AC", accent4: "#81A1C1", accent5: "#BFDDE5", accent6: "#739EB0", accent7: "#D4E8EE", accent8: "#4C698C", accent9: "#9DB7C8", accent10: "#6F8FAF" } },
  { id: "shadow-grey", name: "Shadow Grey", category: "dark", colors: { bg: "#1C1C1C", text: "#D6D6D6", accent1: "#7D7D7D", accent2: "#A3A3A3", accent3: "#5A5A5A", accent4: "#D1D1D1", accent5: "#3A3A3A", accent6: "#8E8E8E", accent7: "#BFBFBF", accent8: "#686868", accent9: "#E8E8E8", accent10: "#4A4A4A" } },

  // AMOLED
  { id: "amoled-cyber", name: "AMOLED Cyber", category: "amoled", colors: { bg: "#000000", text: "#E5E7EB", accent1: "#FF66B2", accent2: "#4DEEEA", accent3: "#B388FF", accent4: "#7DF9FF", accent5: "#FFC6E5", accent6: "#D8A8FF", accent7: "#A7F6F2", accent8: "#FF9AD0", accent9: "#E5D4FF", accent10: "#BFEFF2" } },
  { id: "pitch-black-mint", name: "Pitch Black Mint", category: "amoled", colors: { bg: "#000000", text: "#D1FAE5", accent1: "#34D399", accent2: "#6EE7B7", accent3: "#10B981", accent4: "#A7F3D0", accent5: "#065F46", accent6: "#5AD6A5", accent7: "#C9F8E0", accent8: "#0F8A64", accent9: "#E2FFF1", accent10: "#7FE0BF" } },
  { id: "true-obsidian", name: "True Obsidian", category: "amoled", colors: { bg: "#000000", text: "#9CA3AF", accent1: "#F3F4F6", accent2: "#D1D5DB", accent3: "#6B7280", accent4: "#E5E7EB", accent5: "#374151", accent6: "#BFC5CF", accent7: "#F8F9FA", accent8: "#4B5563", accent9: "#A7AFBC", accent10: "#DDE1E7" } },
  { id: "midnight-gold", name: "Midnight Gold", category: "amoled", colors: { bg: "#000000", text: "#EAE6DF", accent1: "#E5A93C", accent2: "#F2C66D", accent3: "#C88B1E", accent4: "#FFE3A8", accent5: "#8A5A00", accent6: "#DDA43D", accent7: "#F7D99A", accent8: "#A87110", accent9: "#FFF0CC", accent10: "#734900" } },
  { id: "eink-slate", name: "Eink Slate", category: "amoled", colors: { bg: "#000000", text: "#CCCCCC", accent1: "#666666", accent2: "#888888", accent3: "#AAAAAA", accent4: "#DDDDDD", accent5: "#444444", accent6: "#777777", accent7: "#BBBBBB", accent8: "#555555", accent9: "#EEEEEE", accent10: "#333333" } },
  { id: "cosmic-dusk", name: "Cosmic Dusk", category: "amoled", colors: { bg: "#000000", text: "#E0DBEC", accent1: "#A78BFA", accent2: "#C4B5FD", accent3: "#F43F5E", accent4: "#F9A8D4", accent5: "#7C3AED", accent6: "#B29AFB", accent7: "#E4D8FF", accent8: "#E55A78", accent9: "#FFD0E2", accent10: "#5B21B6" } },
  { id: "black-coral", name: "Black Coral", category: "amoled", colors: { bg: "#000000", text: "#FCE7F3", accent1: "#FB923C", accent2: "#FDBA74", accent3: "#F472B6", accent4: "#FBCFE8", accent5: "#EA580C", accent6: "#FCAB5E", accent7: "#FFD8B2", accent8: "#EC7CBF", accent9: "#FFE4F1", accent10: "#C2410C" } },
  { id: "onyx-teal", name: "Onyx Teal", category: "amoled", colors: { bg: "#000000", text: "#CCFBFF", accent1: "#2DD4BF", accent2: "#5EEAD4", accent3: "#14B8A6", accent4: "#99F6E4", accent5: "#0F766E", accent6: "#44D8C8", accent7: "#D6FFFA", accent8: "#11897F", accent9: "#7CEFE2", accent10: "#C0FFF7" } },
  { id: "dark-nebula", name: "Dark Nebula", category: "amoled", colors: { bg: "#000000", text: "#E0E7FF", accent1: "#818CF8", accent2: "#A5B4FC", accent3: "#6366F1", accent4: "#C7D2FE", accent5: "#4338CA", accent6: "#909AF5", accent7: "#DDE4FF", accent8: "#5A56D8", accent9: "#B8C4FF", accent10: "#EEF2FF" } },
  { id: "mono-minimalist", name: "Mono Minimalist", category: "amoled", colors: { bg: "#000000", text: "#E5E5E5", accent1: "#404040", accent2: "#525252", accent3: "#737373", accent4: "#A3A3A3", accent5: "#D4D4D4", accent6: "#5F5F5F", accent7: "#B8B8B8", accent8: "#8A8A8A", accent9: "#F0F0F0", accent10: "#2B2B2B" } }
];

