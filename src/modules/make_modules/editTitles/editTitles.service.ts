import { seedEditTitles } from "../../../utils/seed";
import { EditTitleModel } from "./editTitles.model";

const updateEditTitleDB = async (
  payload: { name: string; _id: string; reset?: boolean },
  user_id: string,
) => {
  // 🔥 RESET CASE
  if (payload.reset) {
    const result = await EditTitleModel.findOneAndUpdate(
      { user_id },
      {
        $set: {
          titles: seedEditTitles
        }
      },
      { new: true, upsert: true },
    );

    return result;
  }

  const result = await EditTitleModel.findOneAndUpdate(
    {
      user_id,
      "titles._id": payload._id
    },
    {
      $set: {
        "titles.$.name": payload.name
      }
    },
    { new: true },
  );

  return result;
};
const getSingleEditTitleDB = async (id: string) => {
  const doc = await EditTitleModel.findOne(
    { "titles._id": id },
    { "titles.$": 1 } 
  );

  return doc?.titles?.[0] || null;
};
const myEditTitleDB = async (id: string) => {
  const doc = await EditTitleModel.find({user_id:id});

  return doc 
};

export const editTitleService = {
  updateEditTitleDB,  getSingleEditTitleDB , myEditTitleDB
};
