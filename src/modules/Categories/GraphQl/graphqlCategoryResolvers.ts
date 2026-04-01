import { GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLString } from 'graphql';
import { categoryModel } from '@models/category.model.js';
import { subCategoryModel } from '@models/subCategory.model.js';
import { categoryType, subCategoryType } from './graphqlTypes.js';
import createSlug from '@utils/slugGenerator.js';
import { graphqlValidation } from '@middlewares/validation.js';
import { createCategorySchemaQL } from '../category.validationSchemas.js';
import { isAuthQl } from '@middlewares/auth.js';
import { systemRoles } from '@utils/systemRoles.js';
import createCustomId from '@utils/customIdGenerator.js';

export const getAllCategoriesResolver = {
  type: new GraphQLList(categoryType),
  resolve: async () => {
    return categoryModel.find();
  },
};

export const getAllSubCategoriesResolver = {
  type: new GraphQLList(subCategoryType),
  resolve: async () => {
    return subCategoryModel.find();
  },
};

export const createCategoryResolver = {
  type: new GraphQLObjectType({
    name: 'CreateCategory',
    fields: {
      message: { type: GraphQLString },
      category: { type: categoryType },
    },
  }),
  args: {
    name: { type: new GraphQLNonNull(GraphQLString) },
    token: { type: new GraphQLNonNull(GraphQLString) },
  },
  resolve: async (_: unknown, args: { name: string; token: string }) => {
    graphqlValidation(createCategorySchemaQL, args);

    const authUser = await isAuthQl([systemRoles.ADMIN], args.token);

    const category = await categoryModel.create({
      name: args.name,
      slug: createSlug(args.name),
      customId: createCustomId(),
      createdBy: authUser._id,
    });

    return { message: 'Done', category };
  },
};
