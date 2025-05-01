import { Component, OnInit } from '@angular/core';
import { FoyerService } from '../../services/foyer.service';
import { Foyer } from '../../models/foyer';

@Component({
  selector: 'app-foyer',
  templateUrl: './foyer.component.html',
  styleUrls: ['./foyer.component.css']
})
export class FoyerComponent implements OnInit {
  foyers: Foyer[] = [];
  selectedFoyer: Foyer = { nomFoyer: '', capaciteFoyer: 0 };
  isEditMode = false;

  constructor(private foyerService: FoyerService) { }

  ngOnInit(): void {
    this.loadFoyers();
  }

  loadFoyers(): void {
    this.foyerService.getAllFoyers().subscribe(data => {
      this.foyers = data;
    });
  }

  onSelect(foyer: Foyer): void {
    this.selectedFoyer = { ...foyer };
    this.isEditMode = true;
  }

  onSubmit(): void {
    if (this.isEditMode) {
      this.foyerService.updateFoyer(this.selectedFoyer).subscribe(() => {
        this.loadFoyers();
        this.resetForm();
      });
    } else {
      this.foyerService.addFoyer(this.selectedFoyer).subscribe(() => {
        this.loadFoyers();
        this.resetForm();
      });
    }
  }

  onDelete(id: number): void {
    this.foyerService.deleteFoyer(id).subscribe(() => {
      this.loadFoyers();
    });
  }

  resetForm(): void {
    this.selectedFoyer = { nomFoyer: '', capaciteFoyer: 0 };
    this.isEditMode = false;
  }
}