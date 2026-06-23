---
layout: post
title: "HighPrep PCR Beads as an AMPureXP Alternative"
date: 2019-10-15
author: "Nicole Adamski"
featured_image: /assets/images/blog/DNA-beads-final-01.png
header_image: /assets/images/header-blog.jpg
comments: true
---

#### **Comparing HighPrep PCR and AMPureXP for cleanup and size selection**

**Written by Hana Husic**

High-throughput sequencing requires precise size selection of DNA fragments in order to increase the amount of usable data generated. If the fragments are too small, sequencing reads could be contaminated with adapter sequences. If the fragments are too long, library quantification is not as accurate and the run could under-cluster, producing less reads. Therefore, size selection is one of the most important steps to consider when preparing your library for sequencing.

AMPureXP beads are widely used for DNA cleanup and size selection. Here, we will compare the performance of AMPureXP beads with HighPrep PCR beads (manufactured by [MagBio Genomics](https://www.magbiogenomics.com/)). They are available at approximately 40% the cost of AMPure beads, providing a low-cost alternative for cleanup and size selection.

#### Starting Sample

The input is a post-amplification DNA library taken from midway through the Nextera XT protocol with a concentration of 5.07 ng/uL, which was determined using a Qubit fluorometer. An electropherogram of the sample run on an Agilent TapeStation is shown below.

![](https://lh4.googleusercontent.com/vzCn6_mtGPfDXjbqskGzdU4PtZ-Xt8csPD2QmVfv4tJO6O8g00407agtPQyjaGwgFpU3y7p8TV6pcPDJ2P4_TX7Op_CwZ47VaeCPsIJ2zSXukWn_CqHq_ay52D7N50Gk6Gk9T71d)

#### Bead Purification Protocol

1. Resuspend room temperature beads
2. Add beads to 20 uL of input sample at the correct ratio
   1. 1.8:1 bead to sample ratio (36 uL beads) removes adapter dimer
   2. 0.8:1 bead to sample ratio (16 uL beads) removes fragments <200 bp
3. Pipette mix 10 times
4. Incubate 5 min at RT
5. Place reaction tubes onto a magnetic tube holder for 2 min
6. Aspirate cleared solution
   1. Leave ~10 uL behind to avoid aspirating beads
7. Dispense 200 uL 80% ethanol and incubate 30 sec at RT. Aspirate out ethanol and discard.
   1. Leave samples on magnet for ethanol wash steps
8. Repeat step 6 for a total of two ethanol washes
   1. Ensure all ethanol is removed after the second wash by using a smaller pipette to remove residual droplets
9. Let the beads dry for 5 to 7 min
10. Remove the reaction tubes from the magnet
11. Add 20 uL elution butter and pipette mix 10 times
12. Incubate 5 min at RT
13. Place reaction tubes onto the magnet for 1 min
14. Aspirate and collect eluant, leaving behind 3-5 uL buffer to avoid aspirating beads

#### Size-Selected Product Comparison

The input sample and all size-selected products were analyzed on a Qubit fluorometer and an Agilent TapeStation to determine concentration and size.

**Qubit Results**

| Sample Name | Concentration in ng/uL |
|---|---|
| Input | 5.07 |
| 0.8x HighPrep | 1.82 |
| 0.8x Ampure | 1.81 |
| 1.8x HighPrep | 3.00 |
| 1.8x Ampure | 2.86 |

As shown in the table above, there is a negligible difference in output concentration between samples cleaned at the same bead:sample ratio, regardless of the type of beads used.

![](https://lh5.googleusercontent.com/G6Hk79l11c3FWi1e2yZ6DkVDeA0drx8iuLymDVnvfngEjwA2cTUEDCxCRSvxLRzBP_gD73Oe-PE_t9w4LPZ2PS356cl2QuPlj2vQ2HBRyHf6ITPbaN5yE9bTMp7Zw-0RcHbpVyzC)

An electropherogram of the input and size-selected products is shown above. Both 1.8x reactions were effective at removing adapter dimers and other small fragments of DNA. Additionally, both 0.8x reactions removed fragments smaller than 200 bp. The traces for reactions at the same bead:sample ratio are almost identical.

#### Conclusion

Based on the concentrations obtained from Qubit and the fragment sizes obtained from the Agilent Tapestation, we can conclude that there is no variation between DNA samples cleaned up using Ampure beads or those using HighPrep PCR beads. Thus, researchers can use the more cost-effective HighPrep PCR beads to do their cleanup and size selection without compromising performance.

**Please contact GenCore with additional questions, or to obtain the official HighPrep PCR Bead quote from MagBio (NYU use only)**.
