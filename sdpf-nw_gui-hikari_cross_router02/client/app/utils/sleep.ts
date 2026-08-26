export const sleep = async (millisecond: number) => {
  return await new Promise(resolve => setTimeout(resolve, millisecond))
}
