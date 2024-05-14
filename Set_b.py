from typing import List, Any

class Typecheck:
    def __call__(self, *args):
        # implement type checking logic here
        pass

_ = Typecheck()

class Set:
    def unique(self, array: List[Any]) -> List[Any]:
        return list(set(array))

    def intersection(self, array1: List[Any], array2: List[Any]) -> List[Any]:
        return [value for value in array1 if value in array2]

    def difference(self, array1: List[Any], array2: List[Any]) -> List[Any]:
        return [value for value in array1 if value not in array2]

    def removeFromArray(self, array1: List[Any], array2: List[Any]) -> List[Any]:
        _(
            {"name": "array1", "value": array1, "type": "array"},
            {"name": "array2", "value": array2, "type": "array"}
        )
        remove_set = set(array2)
        return [value for value in array1 if value not in remove_set]

    def insertIntoArray(self, array1: List[Any], array2: List[Any], insertion_point: int) -> List[Any]:
        return array1[:insertion_point] + array2 + array1[insertion_point:]

    def arraysDifferAt(self, array1: List[Any], array2: List[Any]) -> int:
        for index, (value1, value2) in enumerate(zip(array1, array2)):
            if value1 != value2:
                return index
        return -1
    

if __name__ == "__main__":
    set_obj = Set()
    array1 = [1, 2, 3, 4, 5]
    array2 = [4, 5, 6, 7, 8]
    result = set_obj.removeFromArray(array1, array2)
    print(result)  # [1, 2, 3]