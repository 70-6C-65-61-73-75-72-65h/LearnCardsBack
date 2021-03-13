const searchSmth = async (collection, queryTerm, fieldSearch, fuzzyNum) => {
  try {
    //   aggregation pipeline
    let result = await collection
      .aggregate([
        {
          //   1 stage - search
          // each seach -> send right to the client
          $search: {
            autocomplete: {
              query: `${queryTerm}`,
              path: `${fieldSearch}`,
              //   if we have some mistakes in querystring (<= 2 ) => it still works
              fuzzy: {
                maxEdits: fuzzyNum,
              },
            },
          },
        },
      ])
      .toArray();
    return { success: true, result };
  } catch (error) {
    return { success: false, error };
  }
};
module.exports = searchSmth;
