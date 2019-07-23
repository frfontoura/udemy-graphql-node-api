import { commentMutations } from './resources/comment/comment.schema';
import { postMutations } from './resources/post/post.schema';
import { tokeMutations } from './resources/token/token.schema';
import { userMutations } from './resources/user/user.schema';

const Mutation = `
  type Mutation {
    ${commentMutations}
    ${postMutations}
    ${tokeMutations}
    ${userMutations}
  }
`;

export {
  Mutation
}