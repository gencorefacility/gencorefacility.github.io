---
layout: post
title: "How To Find Out What Barcodes Are In Your Undetermined Reads"
date: 2019-05-02
author: "Mohammed Khalfan"
featured_image: /assets/images/blog/high-undetermined-read-count-2.jpg
header_image: /assets/images/header-blog.jpg
comments: true
---

Sometimes after demultiplexing there exists a high number of **undetermined reads**, i.e. reads which were not assigned to any library based on the barcodes provided. This is most often the result of **incorrect metadata** or **barcode contamination**. Determining what barcodes are present in the undetermined reads can be useful in troubleshooting your run.

![Figure 1. High undetermined read count displayed in MultiQC report](/assets/images/blog/high-undetermined-read-count-2.jpg)
*Figure 1. High undetermined read count displayed in MultiQC report*

**NOTE: If you're sequencing at the NYU Genomics Core, we automatically provide undetermined read data for you in your MultiQC report**

The following script allows you to find out what barcodes are present in your undetermined reads and in what frequency. It takes a .fastq.gz file as input and returns all barcodes present in the fastq file sorted in ascending order of frequency.

<script src="https://gist.github.com/mohammedkhalfan/f2ed9e3455911a302fb6410a499e35b9.js"></script>

### Usage:

1. You must have Python 3 in order to use this script. On the Prince HPC load the Python 3 module like this:
   `module load python3/intel/3.6.3`
2. Save the script above as
   `count_barcode_frequency.py`.
3. Run the script like this:
   `python3 count_barcode_frequency.py input.fastq.gz`
4. The script will return list of barcodes to stdout. Redirect the output to a file to save it for later.
   `python3 count_barcode_frequency.py input.fastq.gz > input_barcodes.txt`

### Output:

The output consists of all barcodes present in the input fastq file sorted in ascending order of frequency. Executing `tail -20` on `input_barcodes.txt` displays the top 20 barcodes found in the input fastq.

```
[mk5636@log-0 temp]$ tail -20 input_barcodes.txt
NNNNNN 42475
GGGGGG 3262198
TAATCG 4550383
CATGGC 5257887
TACAGC 5377243
CACTCA 5530110
ATGAGC 5802017
GAGTGG 5828838
CGTACG 5970294
CACGAT 6319180
ACTGAT 6493155
GTTTCG 6543201
GGTAGC 6715409
CAACTA 6718555
ATTCCT 6747165
CAAAAG 6857987
CAGGCG 6888980
CCAACA 7036683
CATTTT 9409941
GACGAC 12103222
```

Comparing this output with your library metadata can provide useful insight into the reason behind the high undetermined read count.
