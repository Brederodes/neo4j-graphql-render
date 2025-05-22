const { ApolloServer } = require('apollo-server');
const { Neo4jGraphQL } = require("@neo4j/graphql");
const neo4j = require("neo4j-driver");
const dotenv = require("dotenv");

dotenv.config();

const {
    NEO4J_URI,
    NEO4J_USER,
    NEO4J_PASSWORD,
    NEO4J_DATABASE,
    PORT
} = process.env;

const typeDefs = `#graphql
    type Pessoa @node {
        nome: String!
        mensagens: [Mensagem!]! @relationship(type: "ENVIOU", direction: OUT)
    }

    type Mensagem @node {
        conteudo: String!
        timestamp: DateTime!
        remetente: Pessoa! @relationship(type: "ENVIOU", direction: IN)
    }
`;

const driver = neo4j.driver(
    NEO4J_URI,
    neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD)
);

const neoSchema = new Neo4jGraphQL({
    typeDefs,
    driver,
    database: NEO4J_DATABASE,
});

(async () => {
    const schema = await neoSchema.getSchema();

    const server = new ApolloServer({
        schema,
    });

    server.listen({ port: Number(PORT) || 4000 }).then(({ url }) => {
        console.log(`🚀 Server ready at ${url}`);
    });
})();
