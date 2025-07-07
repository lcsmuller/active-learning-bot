# Makefile for LaTeX slides compilation with references
# Author: Automated system
# Date: 2025-07-07

# Variables
TEX_FILE = main
TEX_SOURCE = $(TEX_FILE).tex
PDF_OUTPUT = $(TEX_FILE).pdf
BIB_FILE = referencias.bib

# Auxiliary files generated during compilation
AUX_FILES = *.aux *.bbl *.blg *.log *.out *.nav *.snm *.toc *.fls *.fdb_latexmk *.synctex.gz

# LaTeX compiler
LATEX = pdflatex
BIBTEX = bibtex

# pdflatex flags
LATEX_FLAGS = -interaction=nonstopmode -halt-on-error

.PHONY: all clean distclean help

# Default target
all: $(PDF_OUTPUT)

# Complete compilation with references
$(PDF_OUTPUT): $(TEX_SOURCE) $(BIB_FILE)
	@echo "=== Starting complete LaTeX compilation ==="
	@echo "1. First pdflatex pass..."
	$(LATEX) $(LATEX_FLAGS) $(TEX_SOURCE)
	@echo "2. Processing bibliography with bibtex..."
	$(BIBTEX) $(TEX_FILE)
	@echo "3. Second pdflatex pass (references)..."
	$(LATEX) $(LATEX_FLAGS) $(TEX_SOURCE)
	@echo "4. Third pdflatex pass (cross-references)..."
	$(LATEX) $(LATEX_FLAGS) $(TEX_SOURCE)
	@echo "=== Compilation completed! ==="
	@echo "Generated PDF: $(PDF_OUTPUT)"

# Quick compilation (single pass only)
quick: $(TEX_SOURCE)
	@echo "=== Quick compilation (no bibliography) ==="
	$(LATEX) $(LATEX_FLAGS) $(TEX_SOURCE)

# Clean auxiliary files
clean:
	@echo "=== Removing auxiliary files ==="
	rm -f $(AUX_FILES)
	@echo "Auxiliary files removed."

# Complete cleanup (including PDF)
distclean: clean
	@echo "=== Removing generated PDF ==="
	rm -f $(PDF_OUTPUT)
	@echo "Complete cleanup finished."

# Complete rebuild (clean and recompile)
rebuild: distclean all

# PDF viewer (if available)
view: $(PDF_OUTPUT)
	@if command -v xdg-open >/dev/null 2>&1; then \
		xdg-open $(PDF_OUTPUT); \
	elif command -v open >/dev/null 2>&1; then \
		open $(PDF_OUTPUT); \
	else \
		echo "PDF viewer not found. Please open manually: $(PDF_OUTPUT)"; \
	fi

# Dependency check
check:
	@echo "=== Checking dependencies ==="
	@command -v $(LATEX) >/dev/null 2>&1 || (echo "ERROR: $(LATEX) not found!" && exit 1)
	@command -v $(BIBTEX) >/dev/null 2>&1 || (echo "ERROR: $(BIBTEX) not found!" && exit 1)
	@test -f $(TEX_SOURCE) || (echo "ERROR: $(TEX_SOURCE) not found!" && exit 1)
	@test -f $(BIB_FILE) || (echo "ERROR: $(BIB_FILE) not found!" && exit 1)
	@echo "All dependencies are OK!"

# Watch mode (automatically recompiles when files change)
watch:
	@echo "=== Watch mode activated ==="
	@echo "Press Ctrl+C to stop..."
	@while true; do \
		$(MAKE) -q $(PDF_OUTPUT) || $(MAKE) $(PDF_OUTPUT); \
		sleep 2; \
	done

# Document statistics
stats: $(PDF_OUTPUT)
	@echo "=== Document statistics ==="
	@echo "Source file: $(TEX_SOURCE)"
	@echo "PDF size: $$(du -h $(PDF_OUTPUT) | cut -f1)"
	@echo "Pages: $$(pdfinfo $(PDF_OUTPUT) 2>/dev/null | grep Pages | awk '{print $$2}' || echo 'N/A')"
	@echo "Last modified: $$(stat -c %y $(PDF_OUTPUT) 2>/dev/null || stat -f %Sm $(PDF_OUTPUT) 2>/dev/null || echo 'N/A')"

# Help
help:
	@echo "=== Makefile for LaTeX slides ==="
	@echo ""
	@echo "Available targets:"
	@echo "  all       - Complete compilation with references (default)"
	@echo "  quick     - Quick compilation (no bibliography)"
	@echo "  clean     - Remove auxiliary files"
	@echo "  distclean - Remove auxiliary files and PDF"
	@echo "  rebuild   - Complete cleanup + recompilation"
	@echo "  view      - Open PDF in default viewer"
	@echo "  check     - Check dependencies"
	@echo "  watch     - Automatically recompile (experimental)"
	@echo "  stats     - Show document statistics"
	@echo "  help      - Show this help"
	@echo ""
	@echo "Usage examples:"
	@echo "  make              # Complete compilation"
	@echo "  make clean        # Clean temporary files"
	@echo "  make rebuild      # Rebuild from scratch"
	@echo "  make check        # Check if everything is OK"
