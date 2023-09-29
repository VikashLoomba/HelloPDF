import formidable from "formidable";
import type { NextApiRequest } from "next";

// export const FormidableError = formidable.errors.FormidableError;

export const handleFile = async (
  req: NextApiRequest
): Promise<{ fields: formidable.Fields; files: formidable.Files }> => {
    const form = formidable();
    const [fields, files] = await form.parse(req);
  return new Promise(async (resolve, reject) => {
    resolve({
      files,
      fields,
    });
  });
};