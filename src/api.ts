import { fetchPost } from "siyuan";

/** 写入块属性，`null` 值表示移除该属性 */
export const setBlockAttrs = (
  id: string,
  attrs: Record<string, string | null>,
  callback?: (ok: boolean, msg?: string) => void,
) => {
  fetchPost("/api/attr/setBlockAttrs", { id, attrs }, (response) => {
    if (!callback) {
      return;
    }
    if (response.code === 0) {
      callback(true);
    } else {
      callback(false, response.msg);
    }
  });
};
