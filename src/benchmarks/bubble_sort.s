# Bubble Sort in MiniISA
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
        # Since we have SLT: if R1 < 1, R7 = 1
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
