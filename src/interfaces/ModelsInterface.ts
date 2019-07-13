import { PostModel } from "../models/PostModel";
import { UserModel } from "../models/UserModel";
import { CommentModel } from "../models/CommentModel";

export interface ModelsInterface {

  Comment: CommentModel
  Post: PostModel;
  User: UserModel;

}