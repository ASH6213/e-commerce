import { api } from "../../lib/api";

export type UserCategoryDTO = {
  id: number;
  name: string;
  slug: string;
  image?: string;
};

export const UserCategoryRepository = {
  async list(): Promise<UserCategoryDTO[]> {
    const res = await api.get(`/api/v1/categories`);
    return Array.isArray(res.data) ? res.data : [];
  },
};
