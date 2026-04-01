import { GraphQLObjectType, GraphQLSchema } from 'graphql';
import {
  createCategoryResolver,
  getAllCategoriesResolver,
  getAllSubCategoriesResolver,
} from './graphqlCategoryResolvers.js';

export const categorySchema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'categoryQuerySchema',
    description: 'Category query schema',
    fields: {
      getAllCategories: getAllCategoriesResolver,
      getAllSubCategories: getAllSubCategoriesResolver,
      createCategory: createCategoryResolver,
    },
  }),
});
