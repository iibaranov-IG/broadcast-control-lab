# OLA #1995

Integer descriptors may declare both numeric intervals and named values. The
baseline accepts only interval members whenever intervals exist, which rejects a
value explicitly declared by a label outside those intervals.

The repair retains interval validation and then accepts exact values from the
label map. The regression covers interval value `2`, labeled value `15`, and
undeclared value `16`. BCL compiles the real descriptor implementation: the
regression fails before the repair and passes afterward.
