import * as jwt from 'jsonwebtoken';
import { db, chai, handleError, app, expect } from './../../test-utils';

import { UserInstance } from '../../../src/models/UserModel';
import { PostInstance } from '../../../src/models/PostModel';
import { JWT_SECRET } from '../../../src/utils/utils';
import { CommentInstance } from '../../../src/models/CommentModel';

describe('Comment', () => {

  let token: string;
  let userId: number;
  let postId: number;
  let commentId: number;

  beforeEach(() => {
    return db.Comment.destroy({where: {}})
    .then((rows: number) => db.Post.destroy({where: {}}))
    .then((rows: number) => db.User.destroy({where: {}}))
    .then((rows: number) => db.User.create(
      {
        name: 'Peter Quill',
        email: 'peter@guardians.com',
        password: '1234'
      }
    )).then((user: UserInstance) => {
      userId = user.get('id');
      const payload = { sub: userId }
      token = jwt.sign(payload, JWT_SECRET);

      return db.Post.create(
        {
          title: 'First Post',
          content: 'First Post !!!',
          author: userId,
          photo: 'some_photo'
        }
      );
    }).then((post: PostInstance) => {
      postId = post.get('id');

      return db.Comment.bulkCreate([
        {
          comment: 'First Comment',
          user: userId,
          post: postId
        },
        {
          comment: 'Second Comment',
          user: userId,
          post: postId
        },
        {
          comment: 'Third Comment',
          user: userId,
          post: postId
        },
      ]);
    }).then((comments: CommentInstance[]) => {
      commentId = comments[0].get('id');
    });
  });

  describe('Queries', () => {

    describe('application/json', () => {

      describe('commentsByPost', () => {

        it('should return a list of Comments', () => {
          let body = {
            query: `
              query commentByPost($postId: ID!, $first: Int, $offset: Int) {
                commentsByPost(postId: $postId, first: $first, offset: $offset) {
                  comment
                  user {
                    id
                  }
                  post {
                    id
                  }
                }
              }
            `,
            variables: {
              postId: postId
            }
          };

          return chai.request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .send(JSON.stringify(body))
            .then(res => {
              const comments = res.body.data.commentsByPost;
              expect(res.body.data).to.be.an('object');
              expect(comments).to.be.an('array');
              expect(comments[0]).to.not.have.keys(['id', 'createdAt','updatedAt'])
              expect(comments[0]).to.have.keys(['comment', 'user', 'post'])
              expect(parseInt(comments[0].user.id)).to.equal(userId);
              expect(parseInt(comments[0].post.id)).to.equal(postId);
            }).catch(handleError);
        });

      });

    });

  });

  describe('Mutations', () => {

    describe('application/json', () => {

      describe('createComment', () => {

        it('should create a new Comment', () => {
          let body = {
            query: `
              mutation createNewComment($input: CommentInput!) {
                createComment(input: $input) {
                  comment
                  user {
                    id
                    name
                  }
                  post {
                    id
                    title
                  }
                }
              }
            `,
            variables: {
              input: {
                comment: 'New Comment',
                post: postId
              }
            }
          };

          return chai.request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .set('Authorization', `Bearer ${token}`)
            .send(JSON.stringify(body))
            .then(res => {
              const createdComment = res.body.data.createComment;
              expect(res.body.data).to.be.an('object');
              expect(createdComment).to.be.an('object');
              expect(createdComment).to.have.keys(['comment', 'user', 'post'])
              expect(createdComment.comment).to.equal('New Comment');
              expect(parseInt(createdComment.user.id)).to.equal(userId);
              expect(createdComment.user.name).to.equal('Peter Quill');
              expect(parseInt(createdComment.post.id)).to.equal(postId);
              expect(createdComment.post.title).to.equal('First Post');
            }).catch(handleError);
        });

      });

      describe('updateComment', () => {

        it('should update an existing Comment', () => {
          let body = {
            query: `
              mutation updateExistingComment($id: ID!, $input: CommentInput!) {
                updateComment(id: $id, input: $input) {
                  id
                  comment
                }
              }
            `,
            variables: {
              id: commentId,
              input: {
                comment: 'Comment updated',
                post: postId
              }
            }
          };

          return chai.request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .set('Authorization', `Bearer ${token}`)
            .send(JSON.stringify(body))
            .then(res => {
              const comment = res.body.data.updateComment;
              expect(res.body.data).to.be.an('object');
              expect(comment).to.be.an('object');
              expect(comment).to.have.keys(['comment', 'id'])
              expect(comment.comment).to.equal('Comment updated');
            }).catch(handleError);
        });

      });

      describe('deleteComment', () => {

        it('should delete an existing Comment', () => {
          let body = {
            query: `
              mutation updateExistingComment($id: ID!) {
                deleteComment(id: $id)
              }
            `,
            variables: {
              id: commentId
            }
          };

          return chai.request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .set('Authorization', `Bearer ${token}`)
            .send(JSON.stringify(body))
            .then(res => {
              expect(res.body.data).to.have.key('deleteComment');
              expect(res.body.data.deleteComment).to.be.true;
            }).catch(handleError);
        });

      });

    });

  });

});