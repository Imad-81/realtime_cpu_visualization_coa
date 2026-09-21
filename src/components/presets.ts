/**
 * Built-in Benchmark Programs for ArchLens
 */

export interface PresetProgram {
  id: string;
  name: string;
  category: string;
  description: string;
  code: string;
}

export const PRESET_PROGRAMS: PresetProgram[] = [
  {
    id: 'array_sum',
    name: 'Array Summation',
    category: 'Memory & Loops',
    description: 'Iterates through an 8-element integer array in memory, computes total sum (95), and writes result back to memory.',
    code: `# Array Sum Benchmark in MiniISA
# Computes the sum of elements in an array stored in .data
# Result is stored in R3 and written back to memory at 'result'

.data
array:  .word 5, 12, -3, 40, 18, 7, -9, 25
length: .word 8
result: .space 4

.text
        # R1 = base address of array
        ADDI R1, R0, array
        # R2 = length of array
        LW R2, length(R0)
        # R3 = accumulator (sum) = 0
        ADDI R3, R0, 0
        # R4 = loop index i = 0
        ADDI R4, R0, 0

loop:
        # Check if i == length
        BEQ R4, R2, done

        # Load array[i] into R5
        LW R5, 0(R1)

        # sum += array[i]
        ADD R3, R3, R5

        # R1 += 4 (next element pointer)
        ADDI R1, R1, 4

        # i++
        ADDI R4, R4, 1

        # Jump back to loop
        JMP loop

done:
        # Store result into memory
        SW R3, result(R0)
        HALT
`,
  },
  {
    id: 'fibonacci',
    name: 'Fibonacci Sequence',
    category: 'Arithmetic & Recursion',
    description: 'Computes F(10) = 55 iteratively using registers R2 and R3, storing the final answer into memory.',
    code: `# Fibonacci Benchmark in MiniISA
# Computes F(N) for N = 10 iteratively.
# F(10) = 55

.data
n:      .word 10
ans:    .space 4

.text
        # R1 = N
        LW R1, n(R0)
        # R2 = a = 0 (F(0))
        ADDI R2, R0, 0
        # R3 = b = 1 (F(1))
        ADDI R3, R0, 1
        # R4 = counter i = 1
        ADDI R4, R0, 1

fib_loop:
        # if i == N, done
        BEQ R4, R1, fib_done

        # next = a + b
        ADD R5, R2, R3
        # a = b
        ADDI R2, R3, 0
        # b = next
        ADDI R3, R5, 0

        # i++
        ADDI R4, R4, 1
        JMP fib_loop

fib_done:
        # Store result R3 into memory
        SW R3, ans(R0)
        HALT
`,
  },
  {
    id: 'bubble_sort',
    name: 'Bubble Sort (In-Place)',
    category: 'Algorithms & Branches',
    description: 'Sorts a 5-element array [19, 4, 33, 1, 8] in ascending order directly in data memory using nested loops and branch conditions.',
    code: `# Bubble Sort in MiniISA
# Sorts an array of 5 integers in ascending order in-place in .data

.data
array:  .word 19, 4, 33, 1, 8
len:    .word 5

.text
        # R1 = len
        LW R1, len(R0)
        # Outer loop limit: n - 1
        ADDI R1, R1, -1

outer_loop:
        # If R1 <= 0, sorting is complete
        ADDI R2, R0, 1
        SLT R7, R1, R2
        BNE R7, R0, sort_done

        # R3 = inner loop counter j = 0
        ADDI R3, R0, 0
        # R4 = array pointer = base
        ADDI R4, R0, array

inner_loop:
        # Check if j == R1
        BEQ R3, R1, outer_next

        # Load A[j] into R5, A[j+1] into R6
        LW R5, 0(R4)
        LW R6, 4(R4)

        # Check if A[j+1] < A[j] -> swap
        SLT R7, R6, R5
        BEQ R7, R0, no_swap

        # Swap: A[j] = R6, A[j+1] = R5
        SW R6, 0(R4)
        SW R5, 4(R4)

no_swap:
        # Move to next pair
        ADDI R4, R4, 4
        ADDI R3, R3, 1
        JMP inner_loop

outer_next:
        # Decrement outer loop count
        ADDI R1, R1, -1
        JMP outer_loop

sort_done:
        HALT
`,
  },
  {
    id: 'test_hazards',
    name: 'Hazard & ALU Stress Test',
    category: 'Microarchitecture',
    description: 'Exercises multi-cycle MUL, bitwise operations (AND, OR, XOR), signed SLT comparisons, and taken/untaken branches.',
    code: `# Hazard and Arithmetic Test Program for MiniISA
# Tests arithmetic, logic, MUL, and branch conditions

.text
        # R1 = 7
        ADDI R1, R0, 7
        # R2 = 6
        ADDI R2, R0, 6
        # R3 = R1 * R2 = 42
        MUL R3, R1, R2

        # R4 = R3 - 2 = 40
        ADDI R4, R3, -2

        # R5 = R4 AND 15 = 40 & 15 = 8
        ADDI R6, R0, 15
        AND R5, R4, R6

        # R7 = (R5 < R3) ? 1 : 0 -> 1
        SLT R7, R5, R3

        # Test branch not taken
        BEQ R1, R2, bad_branch

        # Test branch taken
        BEQ R1, R1, good_branch

bad_branch:
        ADDI R0, R0, 999  # Should not reach here

good_branch:
        HALT
`,
  },
];
