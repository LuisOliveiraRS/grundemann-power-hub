export const getPartnerDashboardPath = (type: string | null): string => {
  switch (type) {
    case "admin":
      return "/admin";
    case "fornecedor":
      return "/fornecedor";
    case "oficina":
      return "/oficina";
    case "locadora":
      return "/locadora";
    case "mecanico":
      return "/mecanico";
    default:
      return "/minha-conta";
  }
};

export const getPartnerLabel = (type: string | null): string => {
  switch (type) {
    case "admin":
      return "Área Admin";
    case "fornecedor":
      return "Área Fornecedor";
    case "oficina":
      return "Área Oficina";
    case "locadora":
      return "Área Locadora";
    case "mecanico":
      return "Área Mecânico";
    default:
      return "Minha Conta";
  }
};