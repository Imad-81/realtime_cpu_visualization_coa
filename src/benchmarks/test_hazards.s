# Hazard and Arithmetic Test Program for MiniISA
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
