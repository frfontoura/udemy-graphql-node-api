const tokenTypes = `
  type Token {
    token: String!
  }
`;

const tokeMutations = `
  createToken(email: String!, password: String!): Token
`;

export {
  tokenTypes,
  tokeMutations
}