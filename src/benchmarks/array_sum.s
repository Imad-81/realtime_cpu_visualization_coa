# Array Sum Benchmark in MiniISA
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
        # Since each word is 4 bytes, byte offset = i * 4
        # We can calculate address by adding 4 to R1 in each iteration or using R6
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
