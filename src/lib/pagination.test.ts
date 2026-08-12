import { paginate } from "./pagination";

test("returns the requested page and total page count", () => {
  expect(paginate([1, 2, 3, 4, 5], 2, 2)).toEqual({
    currentPage: 2,
    pagedItems: [3, 4],
    totalPages: 3,
  });
});

test("clamps requested pages to the available range", () => {
  expect(paginate([1, 2, 3], 99, 2)).toEqual({
    currentPage: 2,
    pagedItems: [3],
    totalPages: 2,
  });
  expect(paginate([1, 2, 3], 0, 2).currentPage).toBe(1);
  expect(paginate([1, 2, 3], Number.NaN, 2).currentPage).toBe(1);
});

test("uses a minimum page size of one and keeps empty lists on page one", () => {
  expect(paginate([1, 2, 3], 2, 0)).toEqual({
    currentPage: 2,
    pagedItems: [2],
    totalPages: 3,
  });
  expect(paginate([], 4, Number.NaN)).toEqual({
    currentPage: 1,
    pagedItems: [],
    totalPages: 1,
  });
});
