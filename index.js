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
  type Pessoa {
    nome: String!
    mensagens: [Mensagem!]! @relationship(type: "ENVIOU", direction: OUT)
  }

  type Mensagem {
    conteudo: String!
    timestamp: String!
  }

  type Query {
    mensagensDaPessoa(nome_pessoa: String!): [Mensagem]
      @cypher(
        statement: """
        MATCH (p:Pessoa {nome: $nome_pessoa})-[:ENVIOU]->(m:Mensagem)
        RETURN m
        """
      )
  }
`;

async function startServer() {
  const neoSchema = new Neo4jGraphQL({ 
    typeDefs, 
    driver,
    config: {
      neo4jGraphQLConfig: {
        driverConfig: {
          database: process.env.NEO4J_DATABASE || 'neo4j'
        }
      }
    }
  });

  await neoSchema.assertIndexesAndConstraints({ options: { create: true } });
  const schema = await neoSchema.getSchema();

  const server = new ApolloServer({
    schema,
    context: ({ req }) => ({ req, driver }),
  });

  const port = process.env.PORT || 4000;
  server.listen({ port }).then(({ url }) => {
    console.log(`🚀 Server ready at ${url}`);
  });
}

startServer().catch(error => {
  console.error('Error starting server:', error);
});
