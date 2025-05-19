require('dotenv').config();
const { Neo4jGraphQL } = require("@neo4j/graphql");
const { ApolloServer } = require("apollo-server");
const neo4j = require("neo4j-driver");

// Initialize Neo4j driver
const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
);

// Define GraphQL schema
const typeDefs = `
  type Pessoa @node {
    nome: String!
    mensagens: [Mensagem!]! @relationship(type: "ENVIOU", direction: OUT)
  }

  type Mensagem @node {
    conteudo: String!
    id_msg: String!
    timestamp: String!
    remetente: [Pessoa!]! @relationship(type: "ENVIOU", direction: IN)
  }

  type Query {
    mensagensDaPessoa(nome_pessoa: String!): [Mensagem]
      @cypher(
      statement: "MATCH (p:Pessoa)-[e:ENVIOU]->(m:Mensagem) WHERE p.nome = $nome_pessoa RETURN m"
      columnName: "m"
      )
  }
`;

async function startServer() {
  const neoSchema = new Neo4jGraphQL({ typeDefs, driver });
  const schema = await neoSchema.getSchema();

  const server = new ApolloServer({
    schema,
    context: ({ req }) => ({ req, driver }),
  });

  server.listen({ port: process.env.PORT || 4000 }).then(({ url }) => {
    console.log(`🚀 Server ready at ${url}`);
  });
}

startServer();