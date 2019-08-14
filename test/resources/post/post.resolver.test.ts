import * as jwt from 'jsonwebtoken';
import { db, chai, handleError, app, expect } from './../../test-utils';

import { UserInstance } from '../../../src/models/UserModel';
import { PostInstance } from '../../../src/models/PostModel';
import { JWT_SECRET } from '../../../src/utils/utils';

describe('Post', () => {

  let token: string;
  let userId: number;
  let postId: number;

  beforeEach(() => {
    return db.Comment.destroy({where: {}})
    .then((rows: number) => db.Post.destroy({where: {}}))
    .then((rows: number) => db.User.destroy({where: {}}))
    .then((rows: number) => db.User.create(
      {
        name: 'Rocket',
        email: 'rocket@guardians.com',
        password: '1234'
      }
    )).then((user: UserInstance) => {
      userId = user.get('id');
      const payload = { sub: userId }
      token = jwt.sign(payload, JWT_SECRET);

      return db.Post.bulkCreate([
        {
          title: 'First Post',
          content: 'First Post !!!',
          author: userId,
          photo: 'some_photo'
        },
        {
          title: 'Second Post',
          content: 'Second Post !!!',
          author: userId,
          photo: 'some_photo'
        },
        {
          title: 'Third Post',
          content: 'Third Post !!!',
          author: userId,
          photo: 'some_photo'
        }
      ]);
    }).then((posts: PostInstance[]) => {
      postId = posts[0].get('id');
    });
  });

  describe('Queries', () => {
   
    describe('application/json', () => {

      describe('posts', () => {

        it('should return a list of Posts', () => {
          let body = {
            query: `
              query {
                posts {
                  title
                  content
                  photo
                }
              }
            `
          };

          return chai.request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .send(JSON.stringify(body))
            .then(res => {
              const postList = res.body.data.posts;
              expect(res.body.data).to.be.an('object');
              expect(postList[0]).to.not.have.keys(['id', 'createdAt','updatedAt','author', 'comments'])
              expect(postList[0]).to.have.keys(['title', 'content', 'photo'])
              expect(postList[0].title).to.equal('First Post');
            }).catch(handleError);
        });

        it('should return a single Post with Author and Comments', () => {
          let body = {
            query: `
              query getPost($id: ID!) {
                post(id: $id) {
                  title
                  author {
                    name
                    email
                  }
                  comments {
                    comment
                  }
                }
              }
            `, 
            variables: {
              id: postId
            }
          };

          return chai.request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .send(JSON.stringify(body))
            .then(res => {
              const post = res.body.data.post;
              expect(res.body.data).to.have.key('post');
              expect(post).to.be.an('object');
              expect(post).to.not.have.keys(['id', 'createdAt','updatedAt','content', 'photo'])
              expect(post).to.have.keys(['title', 'author', 'comments'])
              expect(post.title).to.equal('First Post');
              expect(post.author).to.be.an('object').with.keys(['name', 'email']);
              expect(post.author).to.be.an('object').with.not.keys(['id', 'createdAt', 'updatedAt', 'posts']);
            }).catch(handleError);
        });

      });

    });

    describe('application/graphql', () => {

      describe('posts', () => {
        
        it('should return a list of Posts', () => {
          const query = `
              query {
                posts {
                  title
                  content
                  photo
                }
              }
            `;

          return chai.request(app)
            .post('/graphql')
            .set('content-type', 'application/graphql')
            .send(query)
            .then(res => {
              const postList = res.body.data.posts;
              expect(res.body.data).to.be.an('object');
              expect(postList).to.be.an('array');
              expect(postList[0]).to.not.have.keys(['id', 'createdAt','updatedAt','author', 'comments'])
              expect(postList[0]).to.have.keys(['title', 'content', 'photo'])
              expect(postList[0].title).to.equal('First Post');
            }).catch(handleError);
        });

        it('should paginate a list of Posts', () => {
          const query = `
              query getPostsList($first: Int, $offset: Int) {
                posts(first: $first, offset: $offset) {
                  title
                  content
                  photo
                }
              }
            `;

          return chai.request(app)
            .post('/graphql')
            .set('content-type', 'application/graphql')
            .send(query)
            .query({
              variables: JSON.stringify({
                first: 2,
                offset: 1
              })
            })
            .then(res => {
              const postList = res.body.data.posts;
              expect(res.body.data).to.be.an('object');
              expect(postList).to.be.an('array').with.lengthOf(2);
              expect(postList[0]).to.not.have.keys(['id', 'createdAt','updatedAt','author', 'comments'])
              expect(postList[0]).to.have.keys(['title', 'content', 'photo'])
              expect(postList[0].title).to.equal('Second Post');
            }).catch(handleError);
        });

      });
      
    });

  });


});