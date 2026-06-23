---
layout: post
title: "Variant Calling Pipeline: FastQ to Annotated SNPs in Hours"
date: 2016-03-09
author: "Mohammed Khalfan"
featured_image: /assets/images/blog/VariantCallingWorkflow-Updated.jpg
header_image: /assets/images/header-blog.jpg
comments: true
---

**Note:** This pipeline guide has been superseded by the updated [Variant Calling Pipeline using GATK4](/variant-calling-pipeline-gatk4/) post.

Identifying genomic variants, such as single nucleotide polymorphisms (SNPs) and DNA insertions and deletions (indels), can play an important role in scientific discovery. To this end, a pipeline has been developed to allow researchers at the CGSB to rapidly identify and annotate variants. The pipeline employs the [Genome Analysis Toolkit](https://www.broadinstitute.org/gatk/) (GATK) to perform variant calling and is based on the [best practices for variant discovery analysis](https://www.broadinstitute.org/gatk/guide/best-practices.php) outlined by the Broad Institute. Once SNPs have been identified, [SnpEff](http://snpeff.sourceforge.net/) is utilized to annotate and predict the effects of the variants.

## Full List of Tools Used in this Pipeline:

- GATK
- BWA
- Picard
- Samtools
- Bedtools
- SnpEff
- R (dependency for some GATK and Picard steps)

## Script Location:

`prince:/scratch/work/cgsb/scripts/variant_calling/pipeline.sh`

[https://github.com/gencorefacility/variant-calling-pipeline](https://github.com/gencorefacility/variant-calling-pipeline)

## How to use this script:

1. Create a new directory for this project in your home folder on scratch

   ```bash
   cd /scratch/<netID>/
   mkdir variant-calling
   cd variant-calling
   ```

2. Copy pipeline.sh into your project directory

   ```bash
   cp /scratch/work/cgsb/scripts/variant-calling/pipeline.sh .
   ```

3. The pipeline requires six input values. The values can be hard coded into the script, or provided as command line arguments. They are found at the very top of the script.

   1. **DIR**: The directory with your FastQ libraries to be processed. This should be located in `/scratch/cgsb/gencore/out/<PI>/`
   2. **REF**: Reference genome to use. This should be located in the Shared Genome Resource (`/scratch/work/cgsb/reference_genomes/`). Selecting a reference genome from within the Shared Genome Resource ensures that all index files and reference dictionaries required by BWA, Picard, GATK, etc. are available.
   3. **SNPEFF_DB**: The name of the SnpEff database to use. To determine the name of the SnpEff DB to use, issue the following command:

      ```bash
      java -jar /share/apps/snpeff/4.1g/snpEff.jar databases | grep -i SPECIES_NAME
      ```

      From the list of returned results, select the database you wish to use. The value of the first column is the value to input for SNPEFF_DB.

      Example:

      ```bash
      java -jar /share/apps/snpeff/4.1g/snpEff.jar databases | grep -i thaliana
      ```

      Output:

      ```
      athalianaTair10   Arabidopsis_Thaliana    http://downloads.sourceforge.net/...
      ```

      Then:

      ```bash
      SNPEFF_DB='athalianaTair10'
      ```

      **Note:** If your organism is not available in SnpEff, it is possible to create a custom SnpEff Database if a reference fasta and gff file are available.

   4. **PL**: Platform. Ex: illumina
   5. **PM**: Machine. Ex: nextseq
   6. **EMAIL**: Your email address. Used to report PBS job failures

   In the example below, I have hard coded the parameters in the script:

   ```bash
   DIR='/data/cgsb/gencore/out/Gresham/2015-10-23_HK5NHBGXX/lib1-26/'
   REF='/scratch/work/cgsb/reference_genomes/Public/Fungi/Saccharomyces_cerevisiae/GCF_000146045.2_R64/GCF_000146045.2_R64_genomic.fna'
   SNPEFF_DB='GCF_000146045.2_R64'
   PL='illumina'
   PM='nextseq'
   EMAIL='some1@nyu.edu'
   ```

4. Run the script. If you hard coded the parameters in the script as shown in the example above, no additional parameters need to be provided. Simply run:

   ```bash
   sh pipeline.sh
   ```

5. Optional: Monitor the jobs

   ```bash
   watch -d qstat -u <netID>
   ```

## Overview of the pipeline

![Variant Calling Workflow](/assets/images/blog/VariantCallingWorkflow-Updated.jpg)

### Step 1: Alignment - Map to Reference (BWA MEM)

- **Input:** .fastq files, reference genome
- **Output:** aligned_reads.sam (intermediary)

Map reads to reference genome using BWA MEM. The -M flag is required for Picard and GATK compatibility. Read group information is required by GATK and must be included at this step.

```bash
bwa mem -M -R '@RG\tID:sample_1\tLB:sample_1\tPL:ILLUMINA\tPM:HISEQ\tSM:sample_1' ref input_1 input_2 > aligned_reads.sam
```

### Step 2: Sort SAM file by coordinate, convert to BAM (Picard)

- **Input:** aligned_reads.sam
- **Output:** sorted_reads.bam (intermediary)

Sort the aligned reads by coordinate and convert to BAM format using Picard SortSam.

```bash
java -jar picard.jar SortSam INPUT=aligned_reads.sam OUTPUT=sorted_reads.bam SORT_ORDER=coordinate
```

### Step 3: Collect Alignment & Insert Size Metrics (Picard, R, Samtools)

- **Input:** sorted_reads.bam, reference genome
- **Output:** alignment_metrics.txt, insert_metrics.txt, insert_size_histogram.pdf, depth_out.txt

Collect alignment and insert size metrics to assess the quality of the data. R is required to generate the insert size histogram.

```bash
java -jar picard.jar CollectAlignmentSummaryMetrics R=ref I=sorted_reads.bam O=alignment_metrics.txt
```

```bash
java -jar picard.jar CollectInsertSizeMetrics INPUT=sorted_reads.bam OUTPUT=insert_metrics.txt HISTOGRAM_FILE=insert_size_histogram.pdf
```

```bash
samtools depth -a sorted_reads.bam > depth_out.txt
```

### Step 4: Mark Duplicates (Picard)

- **Input:** sorted_reads.bam
- **Output:** dedup_reads.bam (intermediary), metrics.txt

Mark duplicate reads to avoid counting them during variant calling.

```bash
java -jar picard.jar MarkDuplicates INPUT=sorted_reads.bam OUTPUT=dedup_reads.bam METRICS_FILE=metrics.txt
```

### Step 5: Build BAM Index (Picard)

- **Input:** dedup_reads.bam
- **Output:** dedup_reads.bai (intermediary)

Build a BAM index for the deduplicated BAM file, which is required for downstream GATK processing.

```bash
java -jar picard.jar BuildBamIndex INPUT=dedup_reads.bam
```

### Step 6: Create Realignment Targets (GATK)

- **Input:** dedup_reads.bam, reference genome
- **Output:** realignment_targets.list

This is the first step in a two-step process of realigning reads around indels. This step identifies regions that need to be realigned.

```bash
java -jar GenomeAnalysisTK.jar -T RealignerTargetCreator -R ref -I dedup_reads.bam -o realignment_targets.list
```

### Step 7: Realign Indels (GATK)

- **Input:** dedup_reads.bam, realignment_targets.list, reference genome
- **Output:** realigned_reads.bam

This step performs the actual realignment around the indels identified in the previous step.

```bash
java -jar GenomeAnalysisTK.jar -T IndelRealigner -R ref -I dedup_reads.bam -targetIntervals realignment_targets.list -o realigned_reads.bam
```

### Step 8: Call Variants (GATK)

- **Input:** realigned_reads.bam, reference genome
- **Output:** raw_variants.vcf

Perform the first round of variant calling using GATK HaplotypeCaller on the realigned BAM file.

```bash
java -jar GenomeAnalysisTK.jar -T HaplotypeCaller -R ref -I realigned_reads.bam -o raw_variants.vcf
```

### Step 9: Extract SNPs & Indels (GATK)

- **Input:** raw_variants.vcf, reference genome
- **Output:** raw_snps.vcf, raw_indels.vcf

Separate the raw variants into SNPs and Indels so they can be processed and filtered independently.

```bash
java -jar GenomeAnalysisTK.jar -T SelectVariants -R ref -V raw_variants.vcf -selectType SNP -o raw_snps.vcf
```

```bash
java -jar GenomeAnalysisTK.jar -T SelectVariants -R ref -V raw_variants.vcf -selectType INDEL -o raw_indels.vcf
```

### Step 10: Filter SNPs (GATK)

- **Input:** raw_snps.vcf, reference genome
- **Output:** filtered_snps.vcf

Apply hard filters to the SNP call set. Filter criteria: QD < 2.0, FS > 60.0, MQ < 40.0, MQRankSum < -12.5, ReadPosRankSum < -8.0, SOR > 4.0.

```bash
java -jar GenomeAnalysisTK.jar -T VariantFiltration -R ref -V raw_snps.vcf --filterExpression 'QD < 2.0 || FS > 60.0 || MQ < 40.0 || MQRankSum < -12.5 || ReadPosRankSum < -8.0 || SOR > 4.0' --filterName "basic_snp_filter" -o filtered_snps.vcf
```

### Step 11: Filter Indels (GATK)

- **Input:** raw_indels.vcf, reference genome
- **Output:** filtered_indels.vcf

Apply hard filters to the Indel call set. Filter criteria: QD < 2.0, FS > 200.0, ReadPosRankSum < -20.0, SOR > 10.0.

```bash
java -jar GenomeAnalysisTK.jar -T VariantFiltration -R ref -V raw_indels.vcf --filterExpression 'QD < 2.0 || FS > 200.0 || ReadPosRankSum < -20.0 || SOR > 10.0' --filterName "basic_indel_filter" -o filtered_indels.vcf
```

### Step 12: Base Quality Score Recalibration #1 (GATK)

- **Input:** realigned_reads.bam, filtered_snps.vcf, filtered_indels.vcf, reference genome
- **Output:** recal_data.table (intermediary)

BQSR is performed twice. The second pass is optional but required if you want to generate the recalibration report. The filtered SNPs and Indels from previous steps are used as known sites.

```bash
java -jar GenomeAnalysisTK.jar -T BaseRecalibrator -R ref -I realigned_reads.bam -knownSites filtered_snps.vcf -knownSites filtered_indels.vcf -o recal_data.table
```

### Step 13: Base Quality Score Recalibration #2 (GATK)

- **Input:** recal_data.table, realigned_reads.bam, filtered_snps.vcf, filtered_indels.vcf, reference genome
- **Output:** post_recal_data.table (intermediary)

This step takes the output from the first BQSR run as additional input for generating the recalibration report.

```bash
java -jar GenomeAnalysisTK.jar -T BaseRecalibrator -R ref -I realigned_reads.bam -knownSites filtered_snps.vcf -knownSites filtered_indels.vcf -BQSR recal_data.table -o post_recal_data.table
```

### Step 14: Analyze Covariates (GATK)

- **Input:** recal_data.table, post_recal_data.table, reference genome
- **Output:** recalibration_plots.pdf

Produces a recalibration report based on the two BQSR runs. This report can be used to assess the quality of the recalibration.

```bash
java -jar GenomeAnalysisTK.jar -T AnalyzeCovariates -R ref -before recal_data.table -after post_recal_data.table -plots recalibration_plots.pdf
```

### Step 15: Apply BQSR (GATK)

- **Input:** recal_data.table, realigned_reads.bam, reference genome
- **Output:** recal_reads.bam

Apply the recalibration computed in the first BQSR step to the BAM file.

```bash
java -jar GenomeAnalysisTK.jar -T PrintReads -R ref -I realigned_reads.bam -BQSR recal_data.table -o recal_reads.bam
```

### Step 16: Call Variants (GATK)

- **Input:** recal_reads.bam, reference genome
- **Output:** raw_variants_recal.vcf

Second round of variant calling performed on the recalibrated BAM file.

```bash
java -jar GenomeAnalysisTK.jar -T HaplotypeCaller -R ref -I recal_reads.bam -o raw_variants_recal.vcf
```

### Step 17: Extract SNPs & Indels (GATK)

- **Input:** raw_variants_recal.vcf, reference genome
- **Output:** raw_snps_recal.vcf, raw_indels_recal.vcf

Separate the recalibrated variants into SNPs and Indels.

```bash
java -jar GenomeAnalysisTK.jar -T SelectVariants -R ref -V raw_variants_recal.vcf -selectType SNP -o raw_snps_recal.vcf
```

```bash
java -jar GenomeAnalysisTK.jar -T SelectVariants -R ref -V raw_variants_recal.vcf -selectType INDEL -o raw_indels_recal.vcf
```

### Step 18: Filter SNPs (GATK)

- **Input:** raw_snps_recal.vcf, reference genome
- **Output:** filtered_snps_final.vcf

Apply the same hard filters as Step 10 to the recalibrated SNP call set. Filter criteria: QD < 2.0, FS > 60.0, MQ < 40.0, MQRankSum < -12.5, ReadPosRankSum < -8.0, SOR > 4.0.

```bash
java -jar GenomeAnalysisTK.jar -T VariantFiltration -R ref -V raw_snps_recal.vcf --filterExpression 'QD < 2.0 || FS > 60.0 || MQ < 40.0 || MQRankSum < -12.5 || ReadPosRankSum < -8.0 || SOR > 4.0' --filterName "basic_snp_filter" -o filtered_snps_final.vcf
```

### Step 19: Filter Indels (GATK)

- **Input:** raw_indels_recal.vcf, reference genome
- **Output:** filtered_indels_recal.vcf

Apply the same hard filters as Step 11 to the recalibrated Indel call set. Filter criteria: QD < 2.0, FS > 200.0, ReadPosRankSum < -20.0, SOR > 10.0.

```bash
java -jar GenomeAnalysisTK.jar -T VariantFiltration -R ref -V raw_indels_recal.vcf --filterExpression 'QD < 2.0 || FS > 200.0 || ReadPosRankSum < -20.0 || SOR > 10.0' --filterName "basic_indel_filter" -o filtered_indels_recal.vcf
```

### Step 20: Annotate SNPs and Predict Effects (SnpEff)

- **Input:** filtered_snps_final.vcf
- **Output:** filtered_snps_final.ann.vcf, snpeff_summary.html, snpEff_genes.txt

Use SnpEff to annotate the filtered SNPs and predict the effects of the variants on genes and proteins.

```bash
java -jar snpEff.jar -v snpeff_db filtered_snps_final.vcf > filtered_snps_final.ann.vcf
```

### Step 21: Compute Coverage Statistics (Bedtools)

- **Input:** recal_reads.bam
- **Output:** genomecov.bedgraph

Compute genome coverage statistics. The resulting bedgraph file can be loaded into IGV to view a coverage map across the genome.

```bash
bedtools genomecov -bga -ibam recal_reads.bam > genomecov.bedgraph
```

### Step 22: Compile Statistics (parse_metrics.sh - in house)

- **Input:** alignment_metrics.txt, insert_metrics.txt, raw_snps.vcf, filtered_snps.vcf, raw_snps_recal.vcf, filtered_snps_final.vcf, depth_out.txt
- **Output:** report.csv

An in-house script that compiles summary statistics from various outputs into a single CSV report. The report includes:

- Number of Reads
- Number of Aligned Reads
- Percentage Aligned
- Number of Aligned Bases
- Read Length
- Percentage Paired
- Mean Insert Size
- Number of SNPs
- Number of Filtered SNPs
- Number of SNPs after BQSR
- Number of Filtered SNPs after BQSR
- Average Coverage

## Important Notes

- This pipeline assumes that there are no known variants for the organism of interest. Because of this, the first round of variant calling and filtering is performed to generate a set of known SNPs and Indels to be used in the BQSR step (bootstrapping).
- The current script is designed for Paired End data. Contact us if you need to run the pipeline on Single End reads.
- A maximum of 25 libraries can be processed at a time due to HPC queue limits. Contact us if you need to process more than 25 libraries.

---

This pipeline was presented at the NYU-HiTS seminar on March 03, 2016. Slides are available [here](https://docs.google.com/presentation/d/1g3x6xg0_27wtEVb3rpXBUw2UEnTwCTsnfwjcv2bHm0s/edit?usp=sharing).
