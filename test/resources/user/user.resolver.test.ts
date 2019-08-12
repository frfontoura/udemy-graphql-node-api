import { db, chai, handleError, app, expect } from './../../test-utils';
import { UserInstance } from '../../../src/models/UserModel';

describe('User', () => {

  let userId: number;

  beforeEach(() => {
    return db.Comment.destroy({where: {}})
    .then((rows: number) => db.Post.destroy({where: {}}))
    .then((rows: number) => db.User.destroy({where: {}}))
    .then((rows: number) => db.User.bulkCreate([
      {
        name: 'Peter Quill',
        email: 'peter@guardians.com',
        password: '1234'
      },
      {
        name: 'Rocket Raccoon',
        email: 'rocket@guardians.com',
        password: '1234'
      },
      {
        name: 'Groot',
        email: 'groot@guardians.com',
        password: '1234'
      }
    ]
    )).then((users: UserInstance[]) =>{
      userId = users[0].get('id');
    });
  });
  
  describe('Queries', () => {
    describe('application/json', () => {
      
      describe('users', () => {

        it('shoud return a list of Users', () => {
          let body = {
            query: `
              query {
                users {
                  name
                  email
                }
              }
            `
          };

          return chai.request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .send(JSON.stringify(body))
            .then(res => {
              const usersList = res.body.data.users;
              expect(res.body.data).to.be.an('object');
              expect(usersList[0]).to.not.have.keys(['id', 'photo', 'createdAt','updatedAt','posts'])
              expect(usersList[0]).to.have.keys(['name', 'email'])
            }).catch(handleError);

        });

        it('shoud paginate a list of Users', () => {
          let body = {
            query: `
              query getUserList($first: Int, $offset: Int) {
                users(first: $first, offset: $offset) {
                  name
                  email
                  createdAt
                }
              }
            `,
            variables: {
              first: 2,
              offset: 1
            }
          };

          return chai.request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .send(JSON.stringify(body))
            .then(res => {
              const usersList = res.body.data.users;
              expect(res.body.data).to.be.an('object');
              expect(usersList).to.be.an('array').lengthOf(2);
              expect(usersList[0]).to.not.have.keys(['id', 'photo', 'updatedAt','posts'])
              expect(usersList[0]).to.have.keys(['name', 'email', 'createdAt'])
            }).catch(handleError);

        });

      });

      describe('user', () => {
        
        it('shoud return a single Users', () => {
          let body = {
            query: `
              query getSingleUser($id: ID!) {
                user(id: $id) {
                  id
                  name
                  email
                  posts {
                    title
                  }
                }
              }
            `,
            variables: {
              id: userId
            }
          };

          return chai.request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .send(JSON.stringify(body))
            .then(res => {
              const user = res.body.data.user;
              expect(res.body.data).to.be.an('object');
              expect(user).to.be.an('object');
              expect(user).to.have.keys(['id', 'name', 'email', 'posts'])
              expect(user.name).to.equal('Peter Quill');
              expect(user.email).to.equal('peter@guardians.com');
            }).catch(handleError);

        });

        it('shoud return only \'name \' attribute', () => {
          let body = {
            query: `
              query getSingleUser($id: ID!) {
                user(id: $id) {
                  name
                }
              }
            `,
            variables: {
              id: userId
            }
          };

          return chai.request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .send(JSON.stringify(body))
            .then(res => {
              const user = res.body.data.user;
              expect(res.body.data).to.be.an('object');
              expect(user).to.be.an('object');
              expect(user).to.have.key('name')
              expect(user).to.not.have.keys(['id', 'email', 'photo', 'createdAt','updatedAt','posts'])
              expect(user.name).to.equal('Peter Quill');
            }).catch(handleError);

        });

        it('shoud return an error if User not exists', () => {
          let body = {
            query: `
              query getSingleUser($id: ID!) {
                user(id: $id) {
                  name
                  email
                }
              }
            `,
            variables: {
              id: -1
            }
          };

          return chai.request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .send(JSON.stringify(body))
            .then(res => {
              expect(res.body.data.user).to.be.null;
              expect(res.body.errors).to.be.an('array');
              expect(res.body).to.have.keys(['data', 'errors']);
              expect(res.body.errors[0].message).to.equal('Error: User with id -1 not found!');
            }).catch(handleError);

        });

      });

    });
  });
});