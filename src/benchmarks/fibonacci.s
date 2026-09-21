# Fibonacci Benchmark in MiniISA
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
