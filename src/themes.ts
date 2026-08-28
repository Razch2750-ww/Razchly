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
  // LIGHT MODE - Sophisticated earthy & editorial neutrals
  { 
    id: "sepia-paper", 
    name: "Sepia Paper", 
    category: "light", 
    colors: { 
      bg: "#F6F1E7", 
      text: "#3D3024", 
      accent1: "#8D6843", 
      accent2: "#B08B64", 
      accent3: "#C9A782", 
      accent4: "#DFD0BF", 
      accent5: "#6E4F30", 
      accent6: "#A17C55", 
      accent7: "#CFB698", 
      accent8: "#543C23", 
      accent9: "#EDE2D2", 
      accent10: "#B89673" 
    } 
  },
  { 
    id: "nordic-light", 
    name: "Nordic Light", 
    category: "light", 
    colors: { 
      bg: "#F8FAFC", 
      text: "#1E293B", 
      accent1: "#3B82F6", 
      accent2: "#60A5FA", 
      accent3: "#93C5FD", 
      accent4: "#CBD5E1", 
      accent5: "#1D4ED8", 
      accent6: "#4B90E2", 
      accent7: "#BFDBFE", 
      accent8: "#1E40AF", 
      accent9: "#E2E8F0", 
      accent10: "#64748B" 
    } 
  },
  { 
    id: "matcha-latte", 
    name: "Matcha Latte", 
    category: "light", 
    colors: { 
      bg: "#F1F5F0", 
      text: "#253529", 
      accent1: "#4E7A57", 
      accent2: "#739F7C", 
      accent3: "#9CBFA4", 
      accent4: "#D2E3D6", 
      accent5: "#35563D", 
      accent6: "#608D6A", 
      accent7: "#B9D4C0", 
      accent8: "#28432E", 
      accent9: "#E4EDE4", 
      accent10: "#86A88E" 
    } 
  },
  { 
    id: "rose-quartz", 
    name: "Rose Quartz", 
    category: "light", 
    colors: { 
      bg: "#FAF4F5", 
      text: "#3D2C31", 
      accent1: "#9E5D6F", 
      accent2: "#C18394", 
      accent3: "#DCAAB7", 
      accent4: "#EED4DC", 
      accent5: "#753E4E", 
      accent6: "#AF7081", 
      accent7: "#E5BFC9", 
      accent8: "#5C2F3D", 
      accent9: "#F5E6EA", 
      accent10: "#986775" 
    } 
  },
  { 
    id: "soft-sand", 
    name: "Soft Sand", 
    category: "light", 
    colors: { 
      bg: "#F4F0EA", 
      text: "#3B352E", 
      accent1: "#8A7156", 
      accent2: "#AE9579", 
      accent3: "#CBBAA2", 
      accent4: "#E6DDCF", 
      accent5: "#67523B", 
      accent6: "#9C8367", 
      accent7: "#D9CCBD", 
      accent8: "#4F3E2B", 
      accent9: "#EFE8DC", 
      accent10: "#B8A38B" 
    } 
  },
  { 
    id: "cloudy-day", 
    name: "Cloudy Day", 
    category: "light", 
    colors: { 
      bg: "#F1F4F6", 
      text: "#243342", 
      accent1: "#476E8E", 
      accent2: "#6C93B3", 
      accent3: "#99B7D1", 
      accent4: "#D0DFEB", 
      accent5: "#2F4D67", 
      accent6: "#597F9E", 
      accent7: "#B5CDDF", 
      accent8: "#21384D", 
      accent9: "#E2EAF0", 
      accent10: "#7EA2BF" 
    } 
  },
  { 
    id: "lavender-mist", 
    name: "Lavender Mist", 
    category: "light", 
    colors: { 
      bg: "#F5F3F9", 
      text: "#2E283C", 
      accent1: "#6F5E8E", 
      accent2: "#9382B2", 
      accent3: "#B9ACD3", 
      accent4: "#DFD9EC", 
      accent5: "#4F406A", 
      accent6: "#8170A0", 
      accent7: "#CAC1DF", 
      accent8: "#3D3053", 
      accent9: "#EDE8F4", 
      accent10: "#A597C3" 
    } 
  },
  { 
    id: "vanilla-cream", 
    name: "Vanilla Cream", 
    category: "light", 
    colors: { 
      bg: "#FAF7EE", 
      text: "#393427", 
      accent1: "#967A38", 
      accent2: "#BA9E5B", 
      accent3: "#D9C387", 
      accent4: "#EDE1BD", 
      accent5: "#6E5621", 
      accent6: "#A88C49", 
      accent7: "#E4D3A4", 
      accent8: "#544015", 
      accent9: "#F4EDD6", 
      accent10: "#C4AC6F" 
    } 
  },
  { 
    id: "sage-garden", 
    name: "Sage Garden", 
    category: "light", 
    colors: { 
      bg: "#F2F5F1", 
      text: "#2C362A", 
      accent1: "#55755A", 
      accent2: "#79987E", 
      accent3: "#A2BCA6", 
      accent4: "#D4E2D7", 
      accent5: "#3C5540", 
      accent6: "#67866C", 
      accent7: "#BDD1C1", 
      accent8: "#2D4130", 
      accent9: "#E5ECE5", 
      accent10: "#8CA990" 
    } 
  },
  { 
    id: "oatmeal", 
    name: "Oatmeal", 
    category: "light", 
    colors: { 
      bg: "#F5F3EC", 
      text: "#38352F", 
      accent1: "#85735B", 
      accent2: "#A6947C", 
      accent3: "#C6B7A2", 
      accent4: "#E5DDD0", 
      accent5: "#61523E", 
      accent6: "#96846B", 
      accent7: "#D7CCBD", 
      accent8: "#4B3D2C", 
      accent9: "#ECE6DB", 
      accent10: "#B4A48E" 
    } 
  },

  // DARK MODE - Tailored architectural & editorial palettes (no neon, no hot glow)
  { 
    id: "dracula-soft", 
    name: "Dracula Soft", 
    category: "dark", 
    colors: { 
      bg: "#1E1F29", 
      text: "#E2E4EC", 
      accent1: "#8B7CB6", 
      accent2: "#A99CD0", 
      accent3: "#685994", 
      accent4: "#CBD0E6", 
      accent5: "#B4708A", 
      accent6: "#9C8DC4", 
      accent7: "#C1B6E0", 
      accent8: "#524479", 
      accent9: "#DED6F2", 
      accent10: "#7969A3" 
    } 
  },
  { 
    id: "deep-ocean", 
    name: "Deep Ocean", 
    category: "dark", 
    colors: { 
      bg: "#0F172A", 
      text: "#E2E8F0", 
      accent1: "#3B82F6", 
      accent2: "#60A5FA", 
      accent3: "#2563EB", 
      accent4: "#93C5FD", 
      accent5: "#1D4ED8", 
      accent6: "#4B90E2", 
      accent7: "#BFDBFE", 
      accent8: "#1E40AF", 
      accent9: "#DBEAFE", 
      accent10: "#60A5FA" 
    } 
  },
  { 
    id: "charcoal-mist", 
    name: "Charcoal Mist", 
    category: "dark", 
    colors: { 
      bg: "#1E2024", 
      text: "#E4E7EC", 
      accent1: "#5E7EB8", 
      accent2: "#82A0D8", 
      accent3: "#436098", 
      accent4: "#B2C6EC", 
      accent5: "#304877", 
      accent6: "#7090C8", 
      accent7: "#C8D7F3", 
      accent8: "#23375C", 
      accent9: "#DEE7F8", 
      accent10: "#4D6B9F" 
    } 
  },
  { 
    id: "forest-night", 
    name: "Forest Night", 
    category: "dark", 
    colors: { 
      bg: "#131915", 
      text: "#E1E8E3", 
      accent1: "#417855", 
      accent2: "#5F9874", 
      accent3: "#2C583D", 
      accent4: "#A4CBB3", 
      accent5: "#1E3F2A", 
      accent6: "#508764", 
      accent7: "#BDDBC9", 
      accent8: "#163120", 
      accent9: "#D7E9DF", 
      accent10: "#366848" 
    } 
  },
  { 
    id: "evergreen", 
    name: "Evergreen", 
    category: "dark", 
    colors: { 
      bg: "#171E1A", 
      text: "#E3E9E5", 
      accent1: "#B0923C", 
      accent2: "#CBB05C", 
      accent3: "#8D7227", 
      accent4: "#E4D293", 
      accent5: "#6B5518", 
      accent6: "#BDA14D", 
      accent7: "#EFE2B3", 
      accent8: "#54410F", 
      accent9: "#F5ECD0", 
      accent10: "#997C2D" 
    } 
  },
  { 
    id: "midnight-blue", 
    name: "Midnight Blue", 
    category: "dark", 
    colors: { 
      bg: "#121624", 
      text: "#E1E6F3", 
      accent1: "#4A6DB5", 
      accent2: "#6C8FD4", 
      accent3: "#335293", 
      accent4: "#A8C0ED", 
      accent5: "#223A6D", 
      accent6: "#5B7EC4", 
      accent7: "#C2D4F4", 
      accent8: "#182C54", 
      accent9: "#DCE7FB", 
      accent10: "#3D5D9E" 
    } 
  },
  { 
    id: "chocolate-dark", 
    name: "Chocolate Dark", 
    category: "dark", 
    colors: { 
      bg: "#1C1715", 
      text: "#EBE4DF", 
      accent1: "#9E7452", 
      accent2: "#BC9270", 
      accent3: "#7D5839", 
      accent4: "#D8B89E", 
      accent5: "#5A3D24", 
      accent6: "#AD8361", 
      accent7: "#E5CDBA", 
      accent8: "#452C17", 
      accent9: "#F0E1D5", 
      accent10: "#8C6544" 
    } 
  },
  { 
    id: "slate-stone", 
    name: "Slate Stone", 
    category: "dark", 
    colors: { 
      bg: "#171B22", 
      text: "#D8DEE9", 
      accent1: "#4E7DA6", 
      accent2: "#6E9CC4", 
      accent3: "#365D82", 
      accent4: "#A7C6E4", 
      accent5: "#254564", 
      accent6: "#5E8BB5", 
      accent7: "#C2DAF0", 
      accent8: "#1B334B", 
      accent9: "#DCEDFA", 
      accent10: "#3F6B92" 
    } 
  },
  { 
    id: "nord-night", 
    name: "Nord Night", 
    category: "dark", 
    colors: { 
      bg: "#242933", 
      text: "#D8DEE9", 
      accent1: "#5E81AC", 
      accent2: "#81A1C1", 
      accent3: "#4C698C", 
      accent4: "#A3BE8C", 
      accent5: "#B48EAD", 
      accent6: "#6F91BA", 
      accent7: "#C2D3E4", 
      accent8: "#3B5270", 
      accent9: "#DCE5EE", 
      accent10: "#506F94" 
    } 
  },
  { 
    id: "shadow-grey", 
    name: "Shadow Grey", 
    category: "dark", 
    colors: { 
      bg: "#18181B", 
      text: "#D4D4D8", 
      accent1: "#71717A", 
      accent2: "#A1A1AA", 
      accent3: "#52525B", 
      accent4: "#E4E4E7", 
      accent5: "#3F3F46", 
      accent6: "#888891", 
      accent7: "#D1D1D6", 
      accent8: "#27272A", 
      accent9: "#F4F4F5", 
      accent10: "#5E5E66" 
    } 
  },

  // AMOLED - Pure black OLED luxury with calibrated, anti-neon accents
  { 
    id: "amoled-cyber", 
    name: "AMOLED Sapphire", 
    category: "amoled", 
    colors: { 
      bg: "#000000", 
      text: "#E5E7EB", 
      accent1: "#3B82F6", 
      accent2: "#60A5FA", 
      accent3: "#2563EB", 
      accent4: "#93C5FD", 
      accent5: "#1D4ED8", 
      accent6: "#4B90E2", 
      accent7: "#BFDBFE", 
      accent8: "#1E40AF", 
      accent9: "#DBEAFE", 
      accent10: "#60A5FA" 
    } 
  },
  { 
    id: "pitch-black-mint", 
    name: "Pitch Black Mint", 
    category: "amoled", 
    colors: { 
      bg: "#000000", 
      text: "#E2F4EB", 
      accent1: "#279668", 
      accent2: "#45BA8A", 
      accent3: "#1A744E", 
      accent4: "#8CD9B6", 
      accent5: "#105436", 
      accent6: "#36A879", 
      accent7: "#B1E8CE", 
      accent8: "#0C3E28", 
      accent9: "#D8F5E7", 
      accent10: "#22835A" 
    } 
  },
  { 
    id: "true-obsidian", 
    name: "True Obsidian", 
    category: "amoled", 
    colors: { 
      bg: "#000000", 
      text: "#D4D4D8", 
      accent1: "#E4E4E7", 
      accent2: "#A1A1AA", 
      accent3: "#71717A", 
      accent4: "#F4F4F5", 
      accent5: "#52525B", 
      accent6: "#BDBDC2", 
      accent7: "#FFFFFF", 
      accent8: "#3F3F46", 
      accent9: "#FAFAFA", 
      accent10: "#8E8E93" 
    } 
  },
  { 
    id: "midnight-gold", 
    name: "Midnight Gold", 
    category: "amoled", 
    colors: { 
      bg: "#000000", 
      text: "#EBE7DF", 
      accent1: "#B88B35", 
      accent2: "#D3A854", 
      accent3: "#946B20", 
      accent4: "#E8C985", 
      accent5: "#6E4D10", 
      accent6: "#C69B45", 
      accent7: "#F2DCAB", 
      accent8: "#543A08", 
      accent9: "#F9EED4", 
      accent10: "#9E7628" 
    } 
  },
  { 
    id: "eink-slate", 
    name: "Eink Slate", 
    category: "amoled", 
    colors: { 
      bg: "#000000", 
      text: "#D4D4D4", 
      accent1: "#737373", 
      accent2: "#949494", 
      accent3: "#525252", 
      accent4: "#CCCCCC", 
      accent5: "#383838", 
      accent6: "#858585", 
      accent7: "#E0E0E0", 
      accent8: "#262626", 
      accent9: "#F0F0F0", 
      accent10: "#606060" 
    } 
  },
  { 
    id: "cosmic-dusk", 
    name: "Cosmic Dusk", 
    category: "amoled", 
    colors: { 
      bg: "#000000", 
      text: "#EDE9F5", 
      accent1: "#7D68B8", 
      accent2: "#9B88D4", 
      accent3: "#A35C78", 
      accent4: "#CBB6EC", 
      accent5: "#5A488B", 
      accent6: "#8C77C6", 
      accent7: "#DDD0F4", 
      accent8: "#44346E", 
      accent9: "#EFE8FA", 
      accent10: "#6D5A9F" 
    } 
  },
  { 
    id: "black-coral", 
    name: "Black Coral", 
    category: "amoled", 
    colors: { 
      bg: "#000000", 
      text: "#F7ECE9", 
      accent1: "#BA5B34", 
      accent2: "#D67750", 
      accent3: "#984422", 
      accent4: "#EAB097", 
      accent5: "#732E14", 
      accent6: "#C86A42", 
      accent7: "#F2CCC0", 
      accent8: "#57200B", 
      accent9: "#FAEDE9", 
      accent10: "#A34C27" 
    } 
  },
  { 
    id: "onyx-teal", 
    name: "Onyx Teal", 
    category: "amoled", 
    colors: { 
      bg: "#000000", 
      text: "#E0F2F1", 
      accent1: "#257E77", 
      accent2: "#3FA098", 
      accent3: "#175E58", 
      accent4: "#7FC3BD", 
      accent5: "#0F443F", 
      accent6: "#328F88", 
      accent7: "#A7DDD8", 
      accent8: "#0A332F", 
      accent9: "#D1F0ED", 
      accent10: "#1E6C66" 
    } 
  },
  { 
    id: "dark-nebula", 
    name: "Dark Nebula", 
    category: "amoled", 
    colors: { 
      bg: "#000000", 
      text: "#E5E7F7", 
      accent1: "#5B67B7", 
      accent2: "#7B88D6", 
      accent3: "#424D94", 
      accent4: "#B1BAEC", 
      accent5: "#2E3773", 
      accent6: "#6A77C7", 
      accent7: "#CBD1F3", 
      accent8: "#212859", 
      accent9: "#E3E7FA", 
      accent10: "#4D58A0" 
    } 
  },
  { 
    id: "mono-minimalist", 
    name: "Mono Minimalist", 
    category: "amoled", 
    colors: { 
      bg: "#000000", 
      text: "#E5E5E5", 
      accent1: "#525252", 
      accent2: "#737373", 
      accent3: "#3D3D3D", 
      accent4: "#A3A3A3", 
      accent5: "#262626", 
      accent6: "#636363", 
      accent7: "#BEBEBE", 
      accent8: "#1A1A1A", 
      accent9: "#DEDEDE", 
      accent10: "#454545" 
    } 
  }
];
